package com.rnziparchive;

import com.facebook.react.TurboReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.module.model.ReactModuleInfo;
import com.facebook.react.module.model.ReactModuleInfoProvider;
import java.util.HashMap;
import java.util.Map;

public class RNZipArchivePackage extends TurboReactPackage {

  @Override
  public NativeModule getModule(String name, ReactApplicationContext reactContext) {
    if (name.equals(RNZipArchiveModule.NAME)) {
      return new RNZipArchiveModule(reactContext);
    }
    return null;
  }

  @Override
  public ReactModuleInfoProvider getReactModuleInfoProvider() {
    return () -> {
      Map<String, ReactModuleInfo> map = new HashMap<>();
      map.put(RNZipArchiveModule.NAME, new ReactModuleInfo(
        RNZipArchiveModule.NAME,       // name
        RNZipArchiveModule.NAME,       // className
        false, // canOverrideExistingModule
        false, // needsEagerInit
        true,  // hasConstants — required for RN 0.70.x compat
        false, // isCXXModule
        true   // isTurboModule = true
      ));
      return map;
    };
  }
}
