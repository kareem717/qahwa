//
//  AECProcessor.mm
//  Echo Cancellation Processor Implementation
//

#import "AECProcessor.h"
#import "LogUtil.h"
#import <AudioUnit/AudioUnit.h>

// Constants for VoiceProcessingIO
static const UInt32 kInputBus = 1;
static const UInt32 kOutputBus = 0;

@interface AECProcessor () {
    // Audio Unit
    AudioUnit _voiceProcessingUnit;
    
    // Configuration
    AECConfig _config;
    
    // State
    BOOL _isProcessing;
    BOOL _isInitialized;
    
    // Callback
    AECProcessedAudioCallback _processedAudioCallback;
    
    // Thread safety
    dispatch_queue_t _aecQueue;
    
    // Audio format
    AudioStreamBasicDescription _audioFormat;
    
    // Internal buffers for processing
    AudioBufferList *_inputBufferList;
    AudioBufferList *_outputBufferList;
    Float32 *_referenceAudioBuffer;
    UInt32 _bufferCapacity;
}

@end

@implementation AECProcessor

#pragma mark - Initialization

+ (AECConfig)defaultConfig {
    AECConfig config;
    config.sampleRate = 48000.0;
    config.channelsPerFrame = 1;
    config.framesPerBuffer = 512;
    config.enableAGC = YES;
    config.enableNoiseSupression = YES;
    config.enableAEC = YES;
    return config;
}

- (nullable instancetype)initWithConfig:(AECConfig)config error:(NSError **)error {
    self = [super init];
    if (self) {
        _config = config;
        _isProcessing = NO;
        _isInitialized = NO;
        _processedAudioCallback = nil;
        _voiceProcessingUnit = NULL;
        _inputBufferList = NULL;
        _outputBufferList = NULL;
        _referenceAudioBuffer = NULL;
        _bufferCapacity = 0;
        
        // Create serial queue for thread safety
        _aecQueue = dispatch_queue_create("aec-processor-queue", DISPATCH_QUEUE_SERIAL);
        
        if (![self setupAudioUnit:error]) {
            return nil;
        }
        
        if (![self setupAudioFormat:error]) {
            return nil;
        }
        
        if (![self allocateBuffers:error]) {
            return nil;
        }
        
        _isInitialized = YES;
        Log("AECProcessor initialized successfully");
    }
    return self;
}

- (void)dealloc {
    [self stopProcessing:nil];
    [self cleanupAudioUnit];
    [self deallocateBuffers];
}

#pragma mark - Audio Unit Setup

- (BOOL)setupAudioUnit:(NSError **)error {
    // Create AudioComponentDescription for VoiceProcessingIO
    AudioComponentDescription desc;
    desc.componentType = kAudioUnitType_Output;
    desc.componentSubType = kAudioUnitSubType_VoiceProcessingIO;
    desc.componentManufacturer = kAudioUnitManufacturer_Apple;
    desc.componentFlags = 0;
    desc.componentFlagsMask = 0;
    
    // Find the component
    AudioComponent component = AudioComponentFindNext(NULL, &desc);
    if (component == NULL) {
        if (error) {
            *error = [NSError errorWithDomain:@"AECProcessor"
                                         code:-1
                                     userInfo:@{NSLocalizedDescriptionKey: @"VoiceProcessingIO component not found"}];
        }
        return NO;
    }
    
    // Create AudioUnit instance
    OSStatus status = AudioComponentInstanceNew(component, &_voiceProcessingUnit);
    if (status != noErr) {
        if (error) {
            *error = [NSError errorWithDomain:@"AECProcessor"
                                         code:status
                                     userInfo:@{NSLocalizedDescriptionKey: @"Failed to create VoiceProcessingIO instance"}];
        }
        return NO;
    }
    
    // Enable input on the input scope of the input element
    UInt32 enableInput = 1;
    status = AudioUnitSetProperty(_voiceProcessingUnit,
                                 kAudioOutputUnitProperty_EnableIO,
                                 kAudioUnitScope_Input,
                                 kInputBus,
                                 &enableInput,
                                 sizeof(enableInput));
    if (status != noErr) {
        if (error) {
            *error = [NSError errorWithDomain:@"AECProcessor"
                                         code:status
                                     userInfo:@{NSLocalizedDescriptionKey: @"Failed to enable input on VoiceProcessingIO"}];
        }
        return NO;
    }
    
    // Enable output on the output scope of the output element
    UInt32 enableOutput = 1;
    status = AudioUnitSetProperty(_voiceProcessingUnit,
                                 kAudioOutputUnitProperty_EnableIO,
                                 kAudioUnitScope_Output,
                                 kOutputBus,
                                 &enableOutput,
                                 sizeof(enableOutput));
    if (status != noErr) {
        if (error) {
            *error = [NSError errorWithDomain:@"AECProcessor"
                                         code:status
                                     userInfo:@{NSLocalizedDescriptionKey: @"Failed to enable output on VoiceProcessingIO"}];
        }
        return NO;
    }
    
    // Configure voice processing features
    if (![self configureVoiceProcessingFeatures:error]) {
        return NO;
    }
    
    Log("VoiceProcessingIO Audio Unit setup successfully");
    return YES;
}

- (BOOL)configureVoiceProcessingFeatures:(NSError **)error {
    OSStatus status;
    
    // Configure AEC
    UInt32 aecEnabled = _config.enableAEC ? 0 : 1; // 0 = enabled, 1 = bypassed
    status = AudioUnitSetProperty(_voiceProcessingUnit,
                                 kAUVoiceIOProperty_BypassVoiceProcessing,
                                 kAudioUnitScope_Global,
                                 0,
                                 &aecEnabled,
                                 sizeof(aecEnabled));
    if (status != noErr) {
        if (error) {
            *error = [NSError errorWithDomain:@"AECProcessor"
                                         code:status
                                     userInfo:@{NSLocalizedDescriptionKey: @"Failed to configure AEC"}];
        }
        return NO;
    }
    
    // Configure AGC
    UInt32 agcEnabled = _config.enableAGC ? 1 : 0;
    status = AudioUnitSetProperty(_voiceProcessingUnit,
                                 kAUVoiceIOProperty_VoiceProcessingEnableAGC,
                                 kAudioUnitScope_Global,
                                 0,
                                 &agcEnabled,
                                 sizeof(agcEnabled));
    if (status != noErr) {
        Log("Warning: Failed to configure AGC, continuing anyway");
    }
    
    // Configure voice processing quality
    UInt32 quality = 127; // Maximum quality value for kAUVoiceIOProperty_VoiceProcessingQuality
    status = AudioUnitSetProperty(_voiceProcessingUnit,
                                 kAUVoiceIOProperty_VoiceProcessingQuality,
                                 kAudioUnitScope_Global,
                                 0,
                                 &quality,
                                 sizeof(quality));
    if (status != noErr) {
        Log("Warning: Failed to set voice processing quality, continuing anyway");
    }
    
    Log("Voice processing features configured");
    return YES;
}

#pragma mark - Audio Format Setup

- (BOOL)setupAudioFormat:(NSError **)error {
    // Set up audio format
    _audioFormat.mSampleRate = _config.sampleRate;
    _audioFormat.mFormatID = kAudioFormatLinearPCM;
    _audioFormat.mFormatFlags = kAudioFormatFlagIsFloat | kAudioFormatFlagIsPacked | kAudioFormatFlagIsNonInterleaved;
    _audioFormat.mFramesPerPacket = 1;
    _audioFormat.mChannelsPerFrame = _config.channelsPerFrame;
    _audioFormat.mBitsPerChannel = 32;
    _audioFormat.mBytesPerPacket = sizeof(Float32);
    _audioFormat.mBytesPerFrame = sizeof(Float32);
    
    // Set format on input scope of input element (microphone)
    OSStatus status = AudioUnitSetProperty(_voiceProcessingUnit,
                                          kAudioUnitProperty_StreamFormat,
                                          kAudioUnitScope_Input,
                                          kInputBus,
                                          &_audioFormat,
                                          sizeof(_audioFormat));
    if (status != noErr) {
        if (error) {
            *error = [NSError errorWithDomain:@"AECProcessor"
                                         code:status
                                     userInfo:@{NSLocalizedDescriptionKey: @"Failed to set input format"}];
        }
        return NO;
    }
    
    // Set format on output scope of input element (processed output)
    status = AudioUnitSetProperty(_voiceProcessingUnit,
                                 kAudioUnitProperty_StreamFormat,
                                 kAudioUnitScope_Output,
                                 kInputBus,
                                 &_audioFormat,
                                 sizeof(_audioFormat));
    if (status != noErr) {
        if (error) {
            *error = [NSError errorWithDomain:@"AECProcessor"
                                         code:status
                                     userInfo:@{NSLocalizedDescriptionKey: @"Failed to set output format"}];
        }
        return NO;
    }
    
    // Set format on input scope of output element (reference audio)
    status = AudioUnitSetProperty(_voiceProcessingUnit,
                                 kAudioUnitProperty_StreamFormat,
                                 kAudioUnitScope_Input,
                                 kOutputBus,
                                 &_audioFormat,
                                 sizeof(_audioFormat));
    if (status != noErr) {
        if (error) {
            *error = [NSError errorWithDomain:@"AECProcessor"
                                         code:status
                                     userInfo:@{NSLocalizedDescriptionKey: @"Failed to set reference format"}];
        }
        return NO;
    }
    
    Log("Audio format configured successfully");
    return YES;
}

#pragma mark - Buffer Management

- (BOOL)allocateBuffers:(NSError **)error {
    _bufferCapacity = _config.framesPerBuffer;
    
    // Allocate input buffer list (for microphone audio)
    _inputBufferList = (AudioBufferList *)calloc(1, sizeof(AudioBufferList) + sizeof(AudioBuffer) * (_config.channelsPerFrame - 1));
    _inputBufferList->mNumberBuffers = _config.channelsPerFrame;
    
    for (UInt32 i = 0; i < _config.channelsPerFrame; i++) {
        _inputBufferList->mBuffers[i].mNumberChannels = 1;
        _inputBufferList->mBuffers[i].mDataByteSize = _bufferCapacity * sizeof(Float32);
        _inputBufferList->mBuffers[i].mData = calloc(_bufferCapacity, sizeof(Float32));
        
        if (!_inputBufferList->mBuffers[i].mData) {
            if (error) {
                *error = [NSError errorWithDomain:@"AECProcessor"
                                             code:-1
                                         userInfo:@{NSLocalizedDescriptionKey: @"Failed to allocate input buffer"}];
            }
            return NO;
        }
    }
    
    // Allocate output buffer list (for processed audio)
    _outputBufferList = (AudioBufferList *)calloc(1, sizeof(AudioBufferList) + sizeof(AudioBuffer) * (_config.channelsPerFrame - 1));
    _outputBufferList->mNumberBuffers = _config.channelsPerFrame;
    
    for (UInt32 i = 0; i < _config.channelsPerFrame; i++) {
        _outputBufferList->mBuffers[i].mNumberChannels = 1;
        _outputBufferList->mBuffers[i].mDataByteSize = _bufferCapacity * sizeof(Float32);
        _outputBufferList->mBuffers[i].mData = calloc(_bufferCapacity, sizeof(Float32));
        
        if (!_outputBufferList->mBuffers[i].mData) {
            if (error) {
                *error = [NSError errorWithDomain:@"AECProcessor"
                                             code:-1
                                         userInfo:@{NSLocalizedDescriptionKey: @"Failed to allocate output buffer"}];
            }
            return NO;
        }
    }
    
    // Allocate reference audio buffer
    _referenceAudioBuffer = (Float32 *)calloc(_bufferCapacity, sizeof(Float32));
    if (!_referenceAudioBuffer) {
        if (error) {
            *error = [NSError errorWithDomain:@"AECProcessor"
                                         code:-1
                                     userInfo:@{NSLocalizedDescriptionKey: @"Failed to allocate reference buffer"}];
        }
        return NO;
    }
    
    Log("Audio buffers allocated successfully");
    return YES;
}

- (void)deallocateBuffers {
    if (_inputBufferList) {
        for (UInt32 i = 0; i < _inputBufferList->mNumberBuffers; i++) {
            if (_inputBufferList->mBuffers[i].mData) {
                free(_inputBufferList->mBuffers[i].mData);
            }
        }
        free(_inputBufferList);
        _inputBufferList = NULL;
    }
    
    if (_outputBufferList) {
        for (UInt32 i = 0; i < _outputBufferList->mNumberBuffers; i++) {
            if (_outputBufferList->mBuffers[i].mData) {
                free(_outputBufferList->mBuffers[i].mData);
            }
        }
        free(_outputBufferList);
        _outputBufferList = NULL;
    }
    
    if (_referenceAudioBuffer) {
        free(_referenceAudioBuffer);
        _referenceAudioBuffer = NULL;
    }
    
    _bufferCapacity = 0;
}

#pragma mark - Audio Unit Callbacks

// Render callback for providing reference audio (system audio) to the output element
static OSStatus ReferenceAudioRenderCallback(void *inRefCon,
                                            AudioUnitRenderActionFlags *ioActionFlags,
                                            const AudioTimeStamp *inTimeStamp,
                                            UInt32 inBusNumber,
                                            UInt32 inNumberFrames,
                                            AudioBufferList *ioData) {
    AECProcessor *processor = (__bridge AECProcessor *)inRefCon;
    return [processor provideReferenceAudio:ioData numFrames:inNumberFrames];
}

- (OSStatus)provideReferenceAudio:(AudioBufferList *)ioData numFrames:(UInt32)numFrames {
    // Copy reference audio data to the output
    if (ioData && ioData->mNumberBuffers > 0 && _referenceAudioBuffer) {
        UInt32 bytesToCopy = MIN(numFrames, _bufferCapacity) * sizeof(Float32);
        
        for (UInt32 i = 0; i < ioData->mNumberBuffers && i < _config.channelsPerFrame; i++) {
            if (ioData->mBuffers[i].mData) {
                memcpy(ioData->mBuffers[i].mData, _referenceAudioBuffer, bytesToCopy);
                ioData->mBuffers[i].mDataByteSize = bytesToCopy;
            }
        }
    }
    
    return noErr;
}

#pragma mark - Public Methods

- (BOOL)startProcessing:(AECProcessedAudioCallback)callback error:(NSError **)error {
    if (!_isInitialized) {
        if (error) {
            *error = [NSError errorWithDomain:@"AECProcessor"
                                         code:-1
                                     userInfo:@{NSLocalizedDescriptionKey: @"AECProcessor not initialized"}];
        }
        return NO;
    }
    
    if (_isProcessing) {
        return YES; // Already processing
    }
    
    __block BOOL success = NO;
    dispatch_sync(_aecQueue, ^{
        self->_processedAudioCallback = [callback copy];
        
        // Set up render callback for reference audio
        AURenderCallbackStruct renderCallbackStruct;
        renderCallbackStruct.inputProc = ReferenceAudioRenderCallback;
        renderCallbackStruct.inputProcRefCon = (__bridge void *)self;
        
        OSStatus status = AudioUnitSetProperty(self->_voiceProcessingUnit,
                                             kAudioUnitProperty_SetRenderCallback,
                                             kAudioUnitScope_Input,
                                             kOutputBus,
                                             &renderCallbackStruct,
                                             sizeof(renderCallbackStruct));
        
        if (status != noErr) {
            if (error) {
                *error = [NSError errorWithDomain:@"AECProcessor"
                                             code:status
                                         userInfo:@{NSLocalizedDescriptionKey: @"Failed to set render callback"}];
            }
            return;
        }
        
        // Initialize the audio unit
        status = AudioUnitInitialize(self->_voiceProcessingUnit);
        if (status != noErr) {
            if (error) {
                *error = [NSError errorWithDomain:@"AECProcessor"
                                             code:status
                                         userInfo:@{NSLocalizedDescriptionKey: @"Failed to initialize VoiceProcessingIO"}];
            }
            return;
        }
        
        self->_isProcessing = YES;
        success = YES;
        Log("AEC processing started");
    });
    
    return success;
}

- (BOOL)stopProcessing:(NSError **)error {
    if (!_isProcessing) {
        return YES; // Already stopped
    }
    
    __block BOOL success = NO;
    dispatch_sync(_aecQueue, ^{
        OSStatus status = AudioUnitUninitialize(self->_voiceProcessingUnit);
        if (status != noErr) {
            Log("Warning: Failed to uninitialize VoiceProcessingIO");
        }
        
        self->_isProcessing = NO;
        self->_processedAudioCallback = nil;
        success = YES;
        Log("AEC processing stopped");
    });
    
    return success;
}

- (BOOL)processAudioFrames:(const Float32 *)microphoneAudio
           referenceAudio:(const Float32 *)referenceAudio
                numFrames:(UInt32)numFrames
           processedAudio:(Float32 *)processedAudio {
    
    if (!_isProcessing || !_isInitialized) {
        return NO;
    }
    
    if (!microphoneAudio || !referenceAudio || !processedAudio || numFrames == 0) {
        return NO;
    }
    
    if (numFrames > _bufferCapacity) {
        Log("Frame count exceeds buffer capacity", "warning");
        return NO;
    }
    
    // Copy reference audio to internal buffer (this will be used by the render callback)
    memcpy(_referenceAudioBuffer, referenceAudio, numFrames * sizeof(Float32));
    
    // Copy microphone audio to input buffer
    for (UInt32 i = 0; i < _config.channelsPerFrame; i++) {
        memcpy(_inputBufferList->mBuffers[i].mData, microphoneAudio, numFrames * sizeof(Float32));
        _inputBufferList->mBuffers[i].mDataByteSize = numFrames * sizeof(Float32);
    }
    
    // Prepare output buffer
    for (UInt32 i = 0; i < _config.channelsPerFrame; i++) {
        _outputBufferList->mBuffers[i].mDataByteSize = numFrames * sizeof(Float32);
    }
    
    // Process audio through VoiceProcessingIO
    AudioUnitRenderActionFlags actionFlags = 0;
    AudioTimeStamp timeStamp = {0};
    timeStamp.mFlags = kAudioTimeStampSampleTimeValid;
    timeStamp.mSampleTime = 0; // You might want to use actual timestamps
    
    OSStatus status = AudioUnitRender(_voiceProcessingUnit,
                                     &actionFlags,
                                     &timeStamp,
                                     kInputBus,
                                     numFrames,
                                     _outputBufferList);
    
    if (status != noErr) {
        Log("Failed to render audio through VoiceProcessingIO", "error");
        return NO;
    }
    
    // Copy processed audio to output buffer
    memcpy(processedAudio, _outputBufferList->mBuffers[0].mData, numFrames * sizeof(Float32));
    
    // Call the callback if set
    if (_processedAudioCallback) {
        dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_HIGH, 0), ^{
            self->_processedAudioCallback(processedAudio, numFrames);
        });
    }
    
    return YES;
}

- (BOOL)updateConfig:(AECConfig)config error:(NSError **)error {
    if (_isProcessing) {
        if (error) {
            *error = [NSError errorWithDomain:@"AECProcessor"
                                         code:-1
                                     userInfo:@{NSLocalizedDescriptionKey: @"Cannot update config while processing"}];
        }
        return NO;
    }
    
    _config = config;
    
    // Reconfigure voice processing features
    return [self configureVoiceProcessingFeatures:error];
}

- (AECConfig)getCurrentConfig {
    return _config;
}

- (BOOL)isProcessing {
    return _isProcessing;
}

#pragma mark - Cleanup

- (void)cleanupAudioUnit {
    if (_voiceProcessingUnit) {
        AudioUnitUninitialize(_voiceProcessingUnit);
        AudioComponentInstanceDispose(_voiceProcessingUnit);
        _voiceProcessingUnit = NULL;
    }
}

@end 