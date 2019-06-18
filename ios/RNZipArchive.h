//
//  RNZipArchive.h
//  RNZipArchive
//
//  Created by Perry Poon on 8/26/15.
//  Copyright (c) 2015 Perry Poon. All rights reserved.
//


#if __has_include(<React/RCTBridgeModule.h>)
#import <React/RCTBridgeModule.h>
#else
#import "RCTBridgeModule.h"
#endif
#import "SSZipArchive/SSZipArchive.h"

@interface RNZipArchive : NSObject<RCTBridgeModule, SSZipArchiveDelegate>

@end
