/**
 * @file NativeModule.mm
 * @brief Node.js native addon implementation for macOS audio management.
 *
 * This file implements the Node.js bindings for the native audio management
 * functionality. It wraps the Objective-C AudioManager class and exposes its
 * functionality to JavaScript through N-API.
 */

#import "AudioManager.h"
#import "LogUtil.h"
#import <napi.h>

/**
 * @class AudioWrapper
 * @brief Node.js wrapper for the AudioManager class.
 *
 * This class provides the JavaScript interface to the native AudioManager
 * functionality. It handles the conversion between JavaScript and native types,
 * manages async operations, and ensures thread-safety when dealing with audio
 * callbacks.
 */
class AudioWrapper : public Napi::ObjectWrap<AudioWrapper> {
public:
  /**
   * @brief Initialize the AudioWrapper class and export it to JavaScript.
   * @param env The N-API environment
   * @param exports The exports object to attach the class to
   * @return The modified exports object
   */
  static Napi::Object Init(Napi::Env env, Napi::Object exports) {
    Napi::HandleScope scope(env);

    Napi::Function func = DefineClass(
        env, "AudioWrapper",
        {
            InstanceMethod("getPermissions", &AudioWrapper::GetPermissions),
            InstanceMethod("requestPermissions",
                           &AudioWrapper::RequestPermissions),
            InstanceMethod("startCapture", &AudioWrapper::StartCapture),
            InstanceMethod("stopCapture", &AudioWrapper::StopCapture),
        });

    Napi::FunctionReference *constructor = new Napi::FunctionReference();
    *constructor = Napi::Persistent(func);
    env.SetInstanceData(constructor);

    exports.Set("AudioWrapper", func);
    return exports;
  }

  /**
   * @brief Constructor for AudioWrapper instances.
   * @param info Constructor arguments from JavaScript
   * @throws Napi::Error if initialization fails
   */
  AudioWrapper(const Napi::CallbackInfo &info)
      : Napi::ObjectWrap<AudioWrapper>(info) {
    Napi::Env env = info.Env();
    Napi::HandleScope scope(env);

    try {
      audioManager = [AudioManager sharedInstance];
      Log("AudioWrapper initialized");
    } catch (const std::exception &e) {
      Log("Failed to initialize AudioWrapper: " + std::string(e.what()),
          "error");
      Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
    }
  }

  ~AudioWrapper() {
    Log("AudioWrapper destructor called", "debug");
    if (_tsfn) {
      _tsfn.Release();
      _tsfn = nullptr;
    }
  }

private:
  AudioManager *audioManager;
  Napi::ThreadSafeFunction _tsfn;

  /**
   * @brief Start audio capture and set up the data callback.
   * @param info Function arguments from JavaScript
   * @return Undefined
   * @throws Napi::Error if capture fails to start
   *
   * Expects a callback function as the first argument that will receive
   * captured audio data as ArrayBuffer objects.
   */
  Napi::Value StartCapture(const Napi::CallbackInfo &info) {
    Napi::Env env = info.Env();

    try {
      // Create a ThreadSafeFunction for the audio data callback
      auto tsfn = Napi::ThreadSafeFunction::New(
          env,
          info[0].As<Napi::Function>(), // JavaScript callback function
          "AudioDataCallback",          // Resource name
          0,                            // Max queue size (0 = unlimited)
          1,                            // Initial thread count
          [](Napi::Env) {               // Finalizer
            Log("ThreadSafeFunction finalizer called", "debug");
          }
      );

      // Store the ThreadSafeFunction in a member variable to prevent it from being garbage collected
      _tsfn = tsfn;

      // Set up the audio data callback
      [audioManager setSystemAudioDataCallback:^(NSData *audioData) {
        auto callback = [audioData](Napi::Env env, Napi::Function jsCallback) {
          try {
            // Create an ArrayBuffer from the raw PCM data
            void *data = const_cast<void *>([audioData bytes]);
            size_t length = [audioData length];
            // Create ArrayBuffer and copy the data
            Napi::ArrayBuffer buffer = Napi::ArrayBuffer::New(env, length);
            memcpy(buffer.Data(), data, length);
            // Call the JavaScript callback with the audio data
            jsCallback.Call({buffer});
          } catch (const std::exception &e) {
            Log(std::string("Exception in callback: ") + e.what(), "error");
          }
        };
        napi_status status = tsfn.NonBlockingCall(callback);
        if (status != napi_ok) {
          Log("Failed to queue callback: " + std::to_string(status), "error");
        }
      }];

      // Start the audio capture
      NSError *error = nil;
      if (![audioManager startCapture:&error]) {
        Log("Failed to start capture", "error");
        if (error) {
          Log([error.localizedDescription UTF8String], "error");
        }
        Napi::Error::New(env, "Failed to start audio capture")
            .ThrowAsJavaScriptException();
        return env.Undefined();
      }

      Log("Audio capture started successfully");
      return env.Undefined();

    } catch (const std::exception &e) {
      Log(e.what(), "error");
      Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
      return env.Undefined();
    }
  }

  /**
   * @brief Stop audio capture and clean up resources.
   * @param info Function arguments from JavaScript
   * @return Undefined
   * @throws Napi::Error if capture fails to stop
   */
  Napi::Value StopCapture(const Napi::CallbackInfo &info) {
    Napi::Env env = info.Env();

    try {
      // Stop the audio capture
      NSError *error = nil;
      if (![audioManager stopCapture:&error]) {
        Log("Failed to stop capture", "error");
        if (error) {
          Log([error.localizedDescription UTF8String], "error");
        }
        Napi::Error::New(env, "Failed to stop audio capture")
            .ThrowAsJavaScriptException();
        return env.Undefined();
      }

      // Clear the audio data callback
      [audioManager setSystemAudioDataCallback:nil];

      // Release the ThreadSafeFunction
      if (_tsfn) {
        _tsfn.Release();
        _tsfn = nullptr;
      }

      Log("Audio capture stopped successfully");
      return env.Undefined();

    } catch (const std::exception &e) {
      Log(e.what(), "error");
      Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
      return env.Undefined();
    }
  }

  /**
   * @brief Get current audio permission status.
   * @param info Function arguments from JavaScript
   * @return Promise that resolves with permission status object
   * @throws Napi::Error if permission check fails
   *
   * Returns an object with 'microphone' and 'audio' permission statuses.
   */
  Napi::Value GetPermissions(const Napi::CallbackInfo &info) {
    Napi::Env env = info.Env();

    try {
      // Create a promise to handle the async operation
      auto deferred = Napi::Promise::Deferred::New(env);

      // Get permissions asynchronously
      NSError *error = nil;
      NSDictionary *permissionData = [audioManager getPermissions];

      if (error) {
        Log([error.localizedDescription UTF8String], "error");
        deferred.Reject(
            Napi::Error::New(env, "Failed to get permissions").Value());
      } else {
        // Convert to JS object
        Napi::Object result = Napi::Object::New(env);
        NSString *micStatus = permissionData[@"microphone"];
        result.Set("microphone", std::string([micStatus UTF8String]));
        NSString *audioStatus = permissionData[@"audio"];
        result.Set("audio", std::string([audioStatus UTF8String]));

        deferred.Resolve(result);
      }

      return deferred.Promise();

    } catch (const std::exception &e) {
      Log(e.what(), "error");
      Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
      return env.Undefined();
    }
  }

  /**
   * @brief Request permission for audio access.
   * @param info Function arguments from JavaScript
   * @return Promise that resolves with permission result
   * @throws Napi::Error if permission request fails
   *
   * Expects device type ('microphone' or 'audio') as first argument.
   */
  Napi::Value RequestPermissions(const Napi::CallbackInfo &info) {
    Napi::Env env = info.Env();

    try {
      if (info.Length() < 1 || !info[0].IsString()) {
        const std::string error = "String expected as first argument";
        Log(error, "error");
        throw Napi::TypeError::New(env, error);
      }

      std::string deviceTypeStr = info[0].As<Napi::String>().Utf8Value();
      DeviceType deviceType = DeviceTypeMicrophone; // default to microphone

      Log("Requesting permission for device: " + deviceTypeStr);

      if (deviceTypeStr == "audio") {
        deviceType = DeviceTypeAudio;
      } else if (deviceTypeStr == "microphone") {
        deviceType = DeviceTypeMicrophone;
      } else {
        const std::string error = "Invalid device type: " + deviceTypeStr;
        Log(error, "error");
        throw Napi::TypeError::New(env, error);
      }

      // Create a promise to handle the async operation
      auto deferred = Napi::Promise::Deferred::New(env);

      // Create a ThreadSafeFunction for the permission callback
      auto tsfn = Napi::ThreadSafeFunction::New(
          env,
          Napi::Function::New(env,
                              [deferred](const Napi::CallbackInfo &info) {
                                auto result = info[0].As<Napi::Object>();
                                deferred.Resolve(result);
                              }),
          "PermissionCallback", 0, 1);

      // Request permissions asynchronously
      [audioManager
          requestPermissionsForDevice:deviceType
                           completion:^(NSDictionary *result) {
                             auto callback = [result, deviceType](
                                                 Napi::Env env,
                                                 Napi::Function jsCallback) {
                               // Convert PermissionStatus to string
                               NSString *statusStr =
                                   deviceType == DeviceTypeMicrophone
                                       ? result[@"microphone"]
                                       : result[@"audio"];
                               jsCallback.Call({Napi::String::New(
                                   env, [statusStr UTF8String])});
                             };

                             tsfn.BlockingCall(callback);
                             tsfn.Release();
                           }];

      return deferred.Promise();

    } catch (const std::exception &e) {
      Log(e.what(), "error");
      Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
      return env.Undefined();
    }
  }
};

/**
 * @brief Initialize the native module.
 * @param env The N-API environment
 * @param exports The exports object to attach the module to
 * @return The modified exports object
 * @throws std::exception if initialization fails
 */
Napi::Object Init(Napi::Env env, Napi::Object exports) {
  try {
    Log("Initializing native module");
    return AudioWrapper::Init(env, exports);
  } catch (const std::exception &e) {
    Log("Failed to initialize native module: " + std::string(e.what()),
        "error");
    throw;
  }
}

NODE_API_MODULE(nativeMacOS, Init)