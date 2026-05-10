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

@interface RNZipArchive : RCTEventEmitter <SSZipArchiveDelegate>

@property (nonatomic) NSString *processedFilePath;
@property (nonatomic) float progress;
@property (nonatomic, copy) void (^progressHandler)(NSUInteger entryNumber, NSUInteger total);
@property (nonatomic, strong) dispatch_queue_t methodQueue;

@end

#ifdef RCT_NEW_ARCH_ENABLED
@interface RNZipArchive () <NativeZipArchiveSpec>
@end
#endif
