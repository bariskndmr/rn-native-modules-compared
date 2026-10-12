#import "TurboHashToolkit.h"
#import <CommonCrypto/CommonDigest.h>

@implementation TurboHashToolkit {
  NSTimer *_timer;
  NSInteger _count;
}

static NSString *SHA256Hex(NSData *data) {
  unsigned char digest[CC_SHA256_DIGEST_LENGTH];
  CC_SHA256(data.bytes, (CC_LONG)data.length, digest);

  static const char digits[] = "0123456789abcdef";
  char hex[CC_SHA256_DIGEST_LENGTH * 2];
  for (int i = 0; i < CC_SHA256_DIGEST_LENGTH; i++) {
    hex[i * 2] = digits[digest[i] >> 4];
    hex[i * 2 + 1] = digits[digest[i] & 0x0f];
  }
  return [[NSString alloc] initWithBytes:hex
                                  length:sizeof(hex)
                                encoding:NSASCIIStringEncoding];
}

// Sync: runs on the JS thread, JS waits for the return value
- (NSNumber *)add:(double)a b:(double)b {
  return @(a + b);
}

- (NSString *)sha256:(NSString *)text {
  return SHA256Hex([text dataUsingEncoding:NSUTF8StringEncoding]);
}

// ReadonlyArray<number> arrives as NSArray<NSNumber *> → copy each byte (this
// is the slow part)
- (NSString *)sha256Bytes:(NSArray *)data {
  NSMutableData *bytes = [NSMutableData dataWithLength:data.count];
  uint8_t *ptr = (uint8_t *)bytes.mutableBytes;
  for (NSUInteger i = 0; i < data.count; i++) {
    ptr[i] = [data[i] unsignedCharValue];
  }
  return SHA256Hex(bytes);
}

// Async (Promise / void) methods already run on this module's own background
// serial queue
- (void)sha256Iterated:(NSString *)text
            iterations:(double)iterations
               resolve:(RCTPromiseResolveBlock)resolve
                reject:(RCTPromiseRejectBlock)reject {
  NSString *current = text;
  NSInteger count = MAX((NSInteger)iterations, 1);
  for (NSInteger i = 0; i < count; i++) {
    current = SHA256Hex([current dataUsingEncoding:NSUTF8StringEncoding]);
  }
  resolve(current);
}

// NSTimer needs a run loop → schedule it on the main queue
- (void)startTicker:(double)intervalMs {
  dispatch_async(dispatch_get_main_queue(), ^{
    [self->_timer invalidate];
    self->_count = 0;

    __weak __typeof(self) weakSelf = self;
    self->_timer = [NSTimer
        scheduledTimerWithTimeInterval:intervalMs / 1000.0
                               repeats:YES
                                 block:^(NSTimer *timer) {
                                   __typeof(self) strongSelf = weakSelf;
                                   if (!strongSelf) {
                                     [timer invalidate];
                                     return;
                                   }
                                   strongSelf->_count += 1;
                                   [strongSelf emitOnTick:@{
                                     @"count" : @(strongSelf->_count)
                                   }];
                                 }];
  });
}

- (void)stopTicker {
  dispatch_async(dispatch_get_main_queue(), ^{
    [self->_timer invalidate];
    self->_timer = nil;
  });
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params {
  return std::make_shared<facebook::react::NativeTurboHashToolkitSpecJSI>(
      params);
}

+ (NSString *)moduleName {
  return @"TurboHashToolkit";
}

@end
