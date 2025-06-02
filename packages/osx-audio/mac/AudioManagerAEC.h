//
//  AudioManagerAEC.h
//  Extended Audio Manager with AEC (Acoustic Echo Cancellation) Support
//
//  This class extends the existing AudioManager to provide echo cancellation
//  capabilities by integrating the AECProcessor for real-time processing.
//

#import <Foundation/Foundation.h>
#import "AudioManager.h"
#import "AECProcessor.h"

NS_ASSUME_NONNULL_BEGIN

/**
 * @brief Callback type for receiving echo-cancelled audio data
 * @param cleanAudio The processed audio with echo cancellation applied
 * @param originalAudio The original microphone audio (for comparison)
 * @param systemAudio The system audio that was used as reference
 */
typedef void (^AudioManagerAECCallback)(NSData *cleanAudio, NSData *originalAudio, NSData *systemAudio);

/**
 * @class AudioManagerAEC
 * @brief Extended AudioManager with AEC capabilities
 *
 * This class provides:
 * - All functionality of the original AudioManager
 * - Additional microphone capture for AEC processing
 * - Real-time echo cancellation using Apple's VoiceProcessingIO
 * - Synchronized audio processing between system audio and microphone
 */
@interface AudioManagerAEC : NSObject

/**
 * @brief Get the singleton instance of AudioManagerAEC
 * @return The shared AudioManagerAEC instance
 */
+ (instancetype)sharedInstance;

/**
 * @brief Start capturing system audio and microphone with AEC processing
 * @param aecCallback Block that receives processed audio data
 * @param error Pointer to NSError that will be set if start fails
 * @return YES if capture started successfully, NO otherwise
 */
- (BOOL)startAECCapture:(AudioManagerAECCallback)aecCallback error:(NSError **)error;

/**
 * @brief Stop AEC capture session
 * @param error Pointer to NSError that will be set if stop fails
 * @return YES if capture stopped successfully, NO otherwise
 */
- (BOOL)stopAECCapture:(NSError **)error;

/**
 * @brief Check if AEC processing is currently active
 * @return YES if AEC processing is active, NO otherwise
 */
- (BOOL)isAECActive;

/**
 * @brief Update AEC configuration
 * @param config New AEC configuration parameters
 * @param error Pointer to NSError that will be set if update fails
 * @return YES if configuration updated successfully, NO otherwise
 */
- (BOOL)updateAECConfig:(AECConfig)config error:(NSError **)error;

/**
 * @brief Get current AEC configuration
 * @return Current AEC configuration
 */
- (AECConfig)getCurrentAECConfig;

/**
 * @brief Get current permission status for audio devices
 * @return Dictionary containing permission status for each device type
 */
- (NSDictionary *)getPermissions;

/**
 * @brief Request permission to access audio devices
 * @param deviceType The type of device to request permission for
 * @param completion Block called with permission result
 */
- (void)requestPermissionsForDevice:(DeviceType)deviceType
                         completion:(void (^)(NSDictionary *))completion;

/**
 * @brief Get default AEC configuration optimized for your audio setup
 * @return Default AEC configuration
 */
+ (AECConfig)defaultAECConfig;

@end

NS_ASSUME_NONNULL_END 