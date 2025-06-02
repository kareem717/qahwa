//
//  AudioManagerAEC.mm
//  Extended Audio Manager with AEC Implementation
//

#import "AudioManagerAEC.h"
#import "LogUtil.h"
#import <AVFoundation/AVFoundation.h>
#import <CoreAudio/CoreAudio.h>

// Buffer management constants
static const UInt32 kAECFrameSize = 512;
static const Float64 kAECSampleRate = 48000.0;
static const UInt32 kAECChannels = 1;

@interface AudioManagerAEC () {
    // Core components
    AudioManager *_audioManager;
    AECProcessor *_aecProcessor;
    
    // State
    BOOL _isAECActive;
    
    // Callback
    AudioManagerAECCallback _aecCallback;
    
    // Thread safety
    dispatch_queue_t _aecManagerQueue;
    
    // Microphone capture
    AudioUnit _microphoneUnit;
    BOOL _microphoneActive;
    AudioStreamBasicDescription _microphoneFormat;
    
    // Audio synchronization buffers
    Float32 *_microphoneBuffer;
    Float32 *_systemAudioBuffer;
    Float32 *_processedAudioBuffer;
    UInt32 _bufferCapacity;
    
    // Circular buffer for audio synchronization
    Float32 *_systemAudioRingBuffer;
    UInt32 _ringBufferSize;
    UInt32 _ringBufferWriteIndex;
    UInt32 _ringBufferReadIndex;
    
    // Synchronization
    dispatch_semaphore_t _bufferSemaphore;
}

@end

@implementation AudioManagerAEC

#pragma mark - Singleton

static AudioManagerAEC *sharedInstance = nil;

+ (instancetype)sharedInstance {
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        sharedInstance = [[self alloc] init];
    });
    return sharedInstance;
}

+ (AECConfig)defaultAECConfig {
    AECConfig config;
    config.sampleRate = kAECSampleRate;
    config.channelsPerFrame = kAECChannels;
    config.framesPerBuffer = kAECFrameSize;
    config.enableAGC = YES;
    config.enableNoiseSupression = YES;
    config.enableAEC = YES;
    return config;
}

#pragma mark - Initialization

- (instancetype)init {
    self = [super init];
    if (self) {
        // Initialize state
        _isAECActive = NO;
        _microphoneActive = NO;
        _aecCallback = nil;
        _microphoneUnit = NULL;
        
        // Create thread-safe queue
        _aecManagerQueue = dispatch_queue_create("aec-manager-queue", DISPATCH_QUEUE_SERIAL);
        _bufferSemaphore = dispatch_semaphore_create(1);
        
        // Initialize components
        _audioManager = [AudioManager sharedInstance];
        
        NSError *error = nil;
        AECConfig config = [AudioManagerAEC defaultAECConfig];
        _aecProcessor = [[AECProcessor alloc] initWithConfig:config error:&error];
        
        if (!_aecProcessor) {
            Log(std::string("Failed to initialize AEC processor: ") + 
                std::string([error.localizedDescription UTF8String]), "error");
            return nil;
        }
        
        // Allocate audio buffers
        if (![self allocateAudioBuffers]) {
            Log("Failed to allocate audio buffers", "error");
            return nil;
        }
        
        // Set up microphone capture
        if (![self setupMicrophoneCapture:&error]) {
            Log(std::string("Failed to setup microphone capture: ") + 
                std::string([error.localizedDescription UTF8String]), "error");
            return nil;
        }
        
        Log("AudioManagerAEC initialized successfully");
    }
    return self;
}

- (void)dealloc {
    [self stopAECCapture:nil];
    [self cleanupMicrophoneCapture];
    [self deallocateAudioBuffers];
}

#pragma mark - Buffer Management

- (BOOL)allocateAudioBuffers {
    _bufferCapacity = kAECFrameSize;
    
    // Allocate processing buffers
    _microphoneBuffer = (Float32 *)calloc(_bufferCapacity, sizeof(Float32));
    _systemAudioBuffer = (Float32 *)calloc(_bufferCapacity, sizeof(Float32));
    _processedAudioBuffer = (Float32 *)calloc(_bufferCapacity, sizeof(Float32));
    
    if (!_microphoneBuffer || !_systemAudioBuffer || !_processedAudioBuffer) {
        Log("Failed to allocate audio processing buffers", "error");
        return NO;
    }
    
    // Allocate ring buffer for system audio synchronization (1 second worth)
    _ringBufferSize = (UInt32)(kAECSampleRate * 1.0); // 1 second buffer
    _systemAudioRingBuffer = (Float32 *)calloc(_ringBufferSize, sizeof(Float32));
    _ringBufferWriteIndex = 0;
    _ringBufferReadIndex = 0;
    
    if (!_systemAudioRingBuffer) {
        Log("Failed to allocate ring buffer", "error");
        return NO;
    }
    
    Log("Audio buffers allocated successfully");
    return YES;
}

- (void)deallocateAudioBuffers {
    if (_microphoneBuffer) {
        free(_microphoneBuffer);
        _microphoneBuffer = NULL;
    }
    if (_systemAudioBuffer) {
        free(_systemAudioBuffer);
        _systemAudioBuffer = NULL;
    }
    if (_processedAudioBuffer) {
        free(_processedAudioBuffer);
        _processedAudioBuffer = NULL;
    }
    if (_systemAudioRingBuffer) {
        free(_systemAudioRingBuffer);
        _systemAudioRingBuffer = NULL;
    }
}

#pragma mark - Microphone Setup

- (BOOL)setupMicrophoneCapture:(NSError **)error {
    // Create AudioComponentDescription for input
    AudioComponentDescription desc;
    desc.componentType = kAudioUnitType_Output;
    desc.componentSubType = kAudioUnitSubType_HALOutput;
    desc.componentManufacturer = kAudioUnitManufacturer_Apple;
    desc.componentFlags = 0;
    desc.componentFlagsMask = 0;
    
    // Find the component
    AudioComponent component = AudioComponentFindNext(NULL, &desc);
    if (component == NULL) {
        if (error) {
            *error = [NSError errorWithDomain:@"AudioManagerAEC"
                                         code:-1
                                     userInfo:@{NSLocalizedDescriptionKey: @"HAL Output component not found"}];
        }
        return NO;
    }
    
    // Create AudioUnit instance
    OSStatus status = AudioComponentInstanceNew(component, &_microphoneUnit);
    if (status != noErr) {
        if (error) {
            *error = [NSError errorWithDomain:@"AudioManagerAEC"
                                         code:status
                                     userInfo:@{NSLocalizedDescriptionKey: @"Failed to create microphone AudioUnit"}];
        }
        return NO;
    }
    
    // Enable input
    UInt32 enableInput = 1;
    status = AudioUnitSetProperty(_microphoneUnit,
                                 kAudioOutputUnitProperty_EnableIO,
                                 kAudioUnitScope_Input,
                                 1, // Input bus
                                 &enableInput,
                                 sizeof(enableInput));
    if (status != noErr) {
        if (error) {
            *error = [NSError errorWithDomain:@"AudioManagerAEC"
                                         code:status
                                     userInfo:@{NSLocalizedDescriptionKey: @"Failed to enable microphone input"}];
        }
        return NO;
    }
    
    // Disable output
    UInt32 disableOutput = 0;
    status = AudioUnitSetProperty(_microphoneUnit,
                                 kAudioOutputUnitProperty_EnableIO,
                                 kAudioUnitScope_Output,
                                 0, // Output bus
                                 &disableOutput,
                                 sizeof(disableOutput));
    if (status != noErr) {
        if (error) {
            *error = [NSError errorWithDomain:@"AudioManagerAEC"
                                         code:status
                                     userInfo:@{NSLocalizedDescriptionKey: @"Failed to disable microphone output"}];
        }
        return NO;
    }
    
    // Set up audio format for microphone
    _microphoneFormat.mSampleRate = kAECSampleRate;
    _microphoneFormat.mFormatID = kAudioFormatLinearPCM;
    _microphoneFormat.mFormatFlags = kAudioFormatFlagIsFloat | kAudioFormatFlagIsPacked;
    _microphoneFormat.mFramesPerPacket = 1;
    _microphoneFormat.mChannelsPerFrame = kAECChannels;
    _microphoneFormat.mBitsPerChannel = 32;
    _microphoneFormat.mBytesPerPacket = sizeof(Float32) * kAECChannels;
    _microphoneFormat.mBytesPerFrame = sizeof(Float32) * kAECChannels;
    
    // Set format on input scope
    status = AudioUnitSetProperty(_microphoneUnit,
                                 kAudioUnitProperty_StreamFormat,
                                 kAudioUnitScope_Output,
                                 1, // Input bus
                                 &_microphoneFormat,
                                 sizeof(_microphoneFormat));
    if (status != noErr) {
        if (error) {
            *error = [NSError errorWithDomain:@"AudioManagerAEC"
                                         code:status
                                     userInfo:@{NSLocalizedDescriptionKey: @"Failed to set microphone format"}];
        }
        return NO;
    }
    
    // Set up input callback
    AURenderCallbackStruct callbackStruct;
    callbackStruct.inputProc = MicrophoneInputCallback;
    callbackStruct.inputProcRefCon = (__bridge void *)self;
    
    status = AudioUnitSetProperty(_microphoneUnit,
                                 kAudioOutputUnitProperty_SetInputCallback,
                                 kAudioUnitScope_Global,
                                 0,
                                 &callbackStruct,
                                 sizeof(callbackStruct));
    if (status != noErr) {
        if (error) {
            *error = [NSError errorWithDomain:@"AudioManagerAEC"
                                         code:status
                                     userInfo:@{NSLocalizedDescriptionKey: @"Failed to set microphone callback"}];
        }
        return NO;
    }
    
    Log("Microphone capture setup successfully");
    return YES;
}

- (void)cleanupMicrophoneCapture {
    if (_microphoneUnit) {
        AudioUnitUninitialize(_microphoneUnit);
        AudioComponentInstanceDispose(_microphoneUnit);
        _microphoneUnit = NULL;
    }
}

#pragma mark - Audio Callbacks

// Microphone input callback
static OSStatus MicrophoneInputCallback(void *inRefCon,
                                      AudioUnitRenderActionFlags *ioActionFlags,
                                      const AudioTimeStamp *inTimeStamp,
                                      UInt32 inBusNumber,
                                      UInt32 inNumberFrames,
                                      AudioBufferList *ioData) {
    AudioManagerAEC *manager = (__bridge AudioManagerAEC *)inRefCon;
    return [manager handleMicrophoneInput:ioActionFlags
                                timeStamp:inTimeStamp
                                busNumber:inBusNumber
                               numFrames:inNumberFrames
                                    data:ioData];
}

- (OSStatus)handleMicrophoneInput:(AudioUnitRenderActionFlags *)ioActionFlags
                        timeStamp:(const AudioTimeStamp *)inTimeStamp
                        busNumber:(UInt32)inBusNumber
                       numFrames:(UInt32)inNumberFrames
                            data:(AudioBufferList *)ioData {
    
    if (!_isAECActive || inNumberFrames == 0) {
        return noErr;
    }
    
    // Create buffer list for microphone input
    AudioBufferList bufferList;
    bufferList.mNumberBuffers = 1;
    bufferList.mBuffers[0].mNumberChannels = kAECChannels;
    bufferList.mBuffers[0].mDataByteSize = inNumberFrames * sizeof(Float32);
    bufferList.mBuffers[0].mData = _microphoneBuffer;
    
    // Get microphone audio data
    OSStatus status = AudioUnitRender(_microphoneUnit,
                                     ioActionFlags,
                                     inTimeStamp,
                                     inBusNumber,
                                     inNumberFrames,
                                     &bufferList);
    
    if (status != noErr) {
        Log("Failed to render microphone audio", "error");
        return status;
    }
    
    // Process audio in chunks matching our AEC frame size
    [self processMicrophoneFrames:(Float32 *)bufferList.mBuffers[0].mData numFrames:inNumberFrames];
    
    return noErr;
}

- (void)processMicrophoneFrames:(Float32 *)micFrames numFrames:(UInt32)numFrames {
    UInt32 frameIndex = 0;
    
    while (frameIndex < numFrames) {
        UInt32 framesToProcess = MIN(kAECFrameSize, numFrames - frameIndex);
        
        // Extract corresponding system audio from ring buffer
        [self extractSystemAudioFrames:_systemAudioBuffer numFrames:framesToProcess];
        
        // Copy microphone frames
        memcpy(_microphoneBuffer, &micFrames[frameIndex], framesToProcess * sizeof(Float32));
        
        // Process through AEC
        BOOL success = [_aecProcessor processAudioFrames:_microphoneBuffer
                                         referenceAudio:_systemAudioBuffer
                                              numFrames:framesToProcess
                                         processedAudio:_processedAudioBuffer];
        
        if (success && _aecCallback) {
            // Convert to NSData for callback
            NSData *cleanAudio = [NSData dataWithBytes:_processedAudioBuffer
                                               length:framesToProcess * sizeof(Float32)];
            NSData *originalAudio = [NSData dataWithBytes:_microphoneBuffer
                                                   length:framesToProcess * sizeof(Float32)];
            NSData *systemAudio = [NSData dataWithBytes:_systemAudioBuffer
                                                 length:framesToProcess * sizeof(Float32)];
            
            dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_HIGH, 0), ^{
                self->_aecCallback(cleanAudio, originalAudio, systemAudio);
            });
        }
        
        frameIndex += framesToProcess;
    }
}

#pragma mark - Ring Buffer Management

- (void)writeSystemAudioToRingBuffer:(const Float32 *)audioData numFrames:(UInt32)numFrames {
    dispatch_semaphore_wait(_bufferSemaphore, DISPATCH_TIME_FOREVER);
    
    for (UInt32 i = 0; i < numFrames; i++) {
        _systemAudioRingBuffer[_ringBufferWriteIndex] = audioData[i];
        _ringBufferWriteIndex = (_ringBufferWriteIndex + 1) % _ringBufferSize;
    }
    
    dispatch_semaphore_signal(_bufferSemaphore);
}

- (void)extractSystemAudioFrames:(Float32 *)outputBuffer numFrames:(UInt32)numFrames {
    dispatch_semaphore_wait(_bufferSemaphore, DISPATCH_TIME_FOREVER);
    
    for (UInt32 i = 0; i < numFrames; i++) {
        outputBuffer[i] = _systemAudioRingBuffer[_ringBufferReadIndex];
        _ringBufferReadIndex = (_ringBufferReadIndex + 1) % _ringBufferSize;
    }
    
    dispatch_semaphore_signal(_bufferSemaphore);
}

#pragma mark - System Audio Integration

- (void)handleSystemAudioData:(NSData *)audioData {
    // Convert NSData to Float32 array
    const int16_t *int16Data = (const int16_t *)audioData.bytes;
    UInt32 numSamples = (UInt32)(audioData.length / sizeof(int16_t));
    
    // Convert int16 to float32 and write to ring buffer
    Float32 *floatData = (Float32 *)malloc(numSamples * sizeof(Float32));
    for (UInt32 i = 0; i < numSamples; i++) {
        floatData[i] = (Float32)int16Data[i] / 32768.0f;
    }
    
    [self writeSystemAudioToRingBuffer:floatData numFrames:numSamples];
    
    free(floatData);
}

#pragma mark - Public Methods

- (BOOL)startAECCapture:(AudioManagerAECCallback)aecCallback error:(NSError **)error {
    if (_isAECActive) {
        return YES; // Already active
    }
    
    __block BOOL success = NO;
    dispatch_sync(_aecManagerQueue, ^{
        // Store callback
        self->_aecCallback = [aecCallback copy];
        
        // Start AEC processor
        if (![self->_aecProcessor startProcessing:^(const Float32 *processedAudio, UInt32 numFrames) {
            // This callback is handled in processMicrophoneFrames
        } error:error]) {
            return;
        }
        
        // Start system audio capture
        [self->_audioManager setSystemAudioDataCallback:^(NSData *audioData) {
            [self handleSystemAudioData:audioData];
        }];
        
        if (![self->_audioManager startCapture:error]) {
            [self->_aecProcessor stopProcessing:nil];
            return;
        }
        
        // Initialize and start microphone AudioUnit
        OSStatus status = AudioUnitInitialize(self->_microphoneUnit);
        if (status != noErr) {
            [self->_audioManager stopCapture:nil];
            [self->_aecProcessor stopProcessing:nil];
            if (error) {
                *error = [NSError errorWithDomain:@"AudioManagerAEC"
                                             code:status
                                         userInfo:@{NSLocalizedDescriptionKey: @"Failed to initialize microphone unit"}];
            }
            return;
        }
        
        status = AudioOutputUnitStart(self->_microphoneUnit);
        if (status != noErr) {
            AudioUnitUninitialize(self->_microphoneUnit);
            [self->_audioManager stopCapture:nil];
            [self->_aecProcessor stopProcessing:nil];
            if (error) {
                *error = [NSError errorWithDomain:@"AudioManagerAEC"
                                             code:status
                                         userInfo:@{NSLocalizedDescriptionKey: @"Failed to start microphone unit"}];
            }
            return;
        }
        
        self->_microphoneActive = YES;
        self->_isAECActive = YES;
        success = YES;
        Log("AEC capture started successfully");
    });
    
    return success;
}

- (BOOL)stopAECCapture:(NSError **)error {
    if (!_isAECActive) {
        return YES; // Already stopped
    }
    
    __block BOOL success = NO;
    dispatch_sync(_aecManagerQueue, ^{
        // Stop microphone
        if (self->_microphoneActive) {
            AudioOutputUnitStop(self->_microphoneUnit);
            AudioUnitUninitialize(self->_microphoneUnit);
            self->_microphoneActive = NO;
        }
        
        // Stop system audio capture
        [self->_audioManager stopCapture:nil];
        
        // Stop AEC processor
        [self->_aecProcessor stopProcessing:nil];
        
        self->_isAECActive = NO;
        self->_aecCallback = nil;
        success = YES;
        Log("AEC capture stopped successfully");
    });
    
    return success;
}

- (BOOL)isAECActive {
    return _isAECActive;
}

- (BOOL)updateAECConfig:(AECConfig)config error:(NSError **)error {
    return [_aecProcessor updateConfig:config error:error];
}

- (AECConfig)getCurrentAECConfig {
    return [_aecProcessor getCurrentConfig];
}

- (NSDictionary *)getPermissions {
    return [_audioManager getPermissions];
}

- (void)requestPermissionsForDevice:(DeviceType)deviceType
                         completion:(void (^)(NSDictionary *))completion {
    [_audioManager requestPermissionsForDevice:deviceType completion:completion];
}

@end 