//
//  AECProcessor.h
//  Echo Cancellation Processor for macOS using VoiceProcessingIO
//
//  This class provides acoustic echo cancellation (AEC) functionality
//  by leveraging Apple's VoiceProcessingIO Audio Unit, which includes
//  built-in AEC, AGC, and noise suppression capabilities.
//

#import <Foundation/Foundation.h>
#import <AudioToolbox/AudioToolbox.h>
#import <CoreAudio/CoreAudio.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * @brief Configuration parameters for the AEC processor
 */
typedef struct {
    Float64 sampleRate;           // Sample rate (typically 48000.0)
    UInt32 channelsPerFrame;      // Number of channels (typically 1 for mono)
    UInt32 framesPerBuffer;       // Buffer size in frames (typically 512)
    BOOL enableAGC;               // Enable Automatic Gain Control
    BOOL enableNoiseSupression;   // Enable Noise Suppression
    BOOL enableAEC;               // Enable Acoustic Echo Cancellation
} AECConfig;

/**
 * @brief Block type for receiving processed audio data
 * @param processedAudio The echo-cancelled audio data
 * @param numFrames Number of audio frames in the buffer
 */
typedef void (^AECProcessedAudioCallback)(const Float32 *processedAudio, UInt32 numFrames);

/**
 * @class AECProcessor
 * @brief Handles acoustic echo cancellation using Apple's VoiceProcessingIO Audio Unit
 *
 * This class provides real-time acoustic echo cancellation by:
 * - Setting up a VoiceProcessingIO Audio Unit
 * - Processing microphone input and reference (system) audio
 * - Delivering echo-cancelled audio via callbacks
 */
@interface AECProcessor : NSObject

/**
 * @brief Initialize AEC processor with configuration
 * @param config Configuration parameters for AEC processing
 * @param error Pointer to NSError that will be set if initialization fails
 * @return Initialized AECProcessor instance or nil if failed
 */
- (nullable instancetype)initWithConfig:(AECConfig)config error:(NSError **)error;

/**
 * @brief Start the AEC processing
 * @param callback Block to receive processed audio data
 * @param error Pointer to NSError that will be set if start fails
 * @return YES if started successfully, NO otherwise
 */
- (BOOL)startProcessing:(AECProcessedAudioCallback)callback error:(NSError **)error;

/**
 * @brief Stop the AEC processing
 * @param error Pointer to NSError that will be set if stop fails
 * @return YES if stopped successfully, NO otherwise
 */
- (BOOL)stopProcessing:(NSError **)error;

/**
 * @brief Process audio frames for echo cancellation
 * @param microphoneAudio Input audio from microphone (near-end)
 * @param referenceAudio Reference audio from system (far-end/what was played)
 * @param numFrames Number of frames in both buffers
 * @param processedAudio Output buffer for processed audio (must be pre-allocated)
 * @return YES if processing succeeded, NO otherwise
 * 
 * @note This method can be called from real-time audio threads
 * @note microphoneAudio and referenceAudio must be synchronized (same time window)
 * @note processedAudio buffer must be allocated by caller with size >= numFrames
 */
- (BOOL)processAudioFrames:(const Float32 *)microphoneAudio
           referenceAudio:(const Float32 *)referenceAudio
                numFrames:(UInt32)numFrames
           processedAudio:(Float32 *)processedAudio;

/**
 * @brief Update AEC configuration parameters
 * @param config New configuration parameters
 * @param error Pointer to NSError that will be set if update fails
 * @return YES if configuration updated successfully, NO otherwise
 */
- (BOOL)updateConfig:(AECConfig)config error:(NSError **)error;

/**
 * @brief Get current AEC configuration
 * @return Current AEC configuration
 */
- (AECConfig)getCurrentConfig;

/**
 * @brief Check if AEC processing is currently active
 * @return YES if processing is active, NO otherwise
 */
- (BOOL)isProcessing;

/**
 * @brief Get default AEC configuration
 * @return Default configuration suitable for most use cases
 */
+ (AECConfig)defaultConfig;

@end

NS_ASSUME_NONNULL_END 