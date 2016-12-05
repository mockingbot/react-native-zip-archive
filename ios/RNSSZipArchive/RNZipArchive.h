//
//  RNZipArchive.h
//  RNZipArchive
//
//  Created by Perry Poon on 8/26/15.
//  Copyright (c) 2015 Perry Poon. All rights reserved.
//

#import "RCTBridgeModule.h"
#import "SSZipArchive/SSZipArchive.h"

@interface RNZipArchive : NSObject<RCTBridgeModule, SSZipArchiveDelegate>

@end
