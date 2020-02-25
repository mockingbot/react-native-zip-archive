//
//  RNZipArchive.h
//  RNZipArchive
//
//  Created by Perry Poon on 8/26/15.
//  Copyright (c) 2015 Perry Poon. All rights reserved.
//

#import "SSZipArchive/SSZipArchive.h"
#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RNZipArchive : RCTEventEmitter<RCTBridgeModule, SSZipArchiveDelegate>

@property (nonatomic) NSString *processedFilePath;
@property (nonatomic) float progress;
@property (nonatomic, copy) void (^progressHandler)(NSUInteger entryNumber, NSUInteger total);

@end
