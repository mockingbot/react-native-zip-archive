//
//  RNZipArchive.h
//  RNZipArchive
//
//  Created by Perry Poon on 8/26/15.
//  Copyright (c) 2015 Perry Poon. All rights reserved.
//

#import "SSZipArchive/SSZipArchive.h"
#import <React/RCTEventEmitter.h>

#ifdef RCT_NEW_ARCH_ENABLED
#import <NativeZipArchiveSpec/NativeZipArchiveSpec.h>
#endif

NS_ASSUME_NONNULL_BEGIN

@interface RNZipArchive : RCTEventEmitter

@property (nonatomic, copy, nullable) NSString *processedFilePath;
@property (nonatomic) float progress;
@property (nonatomic, copy, nullable) void (^progressHandler)(NSUInteger entryNumber, NSUInteger total);

@end

#ifdef RCT_NEW_ARCH_ENABLED
@interface RNZipArchive () <NativeZipArchiveSpec>
@end
#endif

NS_ASSUME_NONNULL_END
