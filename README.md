# Native Modules Playground

[English](#english) · [Türkçe](#türkçe)

---

## English

### Why this project exists

React Native has three ways to write a native module today: **Expo Modules**, **Turbo Modules** and **Nitro Modules**. Reading about them only gets you so far, so this project builds **the same module three times**, once with each approach, and puts them side by side in one app.

Every module implements the same small API, `HashToolkit`:

| Method | Why it's there |
|---|---|
| `add(a, b)` | Sync call with almost no native work, so it measures pure call overhead |
| `sha256(text)` | Sync string in, string out |
| `sha256Bytes(data)` | Binary data transfer |
| `sha256Iterated(text, n)` | Async work off the JS thread (Promise) |
| `startTicker` / `stopTicker` + `onTick` | Native to JS events and callbacks |

A benchmark screen then runs the same workload against all three.

### Project structure

```
modules/
  expo-hash-toolkit/    Expo Modules API (Swift + Kotlin DSL)
  turbo-hash-toolkit/   Turbo Module (TS spec → codegen, ObjC++ + Kotlin)
  nitro-hash-toolkit/   Nitro Module (TS spec → nitrogen, Swift + Kotlin)
src/
  toolkits/             Adapters that put all three behind one HashToolkit interface
  benchmark/cases.ts    Benchmark cases
  app/index.tsx         Benchmark screen
plugins/
  withSceneLifecycle.js Config plugin for the iOS UIScene life cycle
```

### The three approaches at a glance

| | Expo Modules | Turbo Modules | Nitro Modules |
|---|---|---|---|
| Source of truth | Swift/Kotlin DSL | TypeScript spec | TypeScript spec |
| Code generation | None | Codegen (runs on `pod install` / Gradle build) | `nitrogen` (run by hand, output committed) |
| iOS language | Swift | Objective-C++ | Swift |
| Binary data | `Uint8Array` | `number[]` (every byte is copied) | `ArrayBuffer` (no copy) |
| Events | `sendEvent` + `addListener` | `EventEmitter` + `emitOnTick` | Plain callback parameter |
| Instances | Singleton | Singleton | `createHybridObject`, as many as you want |
| Linking | `expo-module.config.json` in `modules/` | `package.json` dependency | `package.json` dependency |

### What we learned

**Expo Modules**
- The least ceremony: no spec file, no codegen. The Swift/Kotlin `ModuleDefinition` DSL is the API.
- Local modules in `modules/` are autolinked through `expo-module.config.json`, with no `package.json` dependency needed.
- `Uint8Array`, Promises and events (`Events` + `sendEvent`) are supported out of the box.

**Turbo Modules**
- The **TS spec is the source of truth**. Codegen turns it into an ObjC protocol (`NativeTurboHashToolkitSpec`) and an abstract Kotlin/Java class.
- Codegen produces **interfaces only**. It never writes method stubs into your files, so you write the matching signatures yourself, and the compiler tells you when they don't match.
- Codegen runs during `pod install` (iOS) and the Gradle build (Android), so with CNG `npx expo prebuild --clean` triggers it too.
- Codegen doesn't support `Uint8Array`/`ArrayBuffer`, so bytes travel as `ReadonlyArray<number>` and get copied one by one.
- `CodegenTypes.EventEmitter<T>` (RN 0.76+) replaces `NativeEventEmitter`. Using it makes the generated iOS class extend `NativeTurboHashToolkitSpecBase`, which provides `emitOnTick`.
- Threading: sync methods run on the JS thread. On iOS, void/Promise methods run on the module's method queue, and on Android on the native modules thread.

**Nitro Modules**
- `nitrogen` generates C++, Swift and Kotlin specs from one TS file. The generated code is committed, so you only rerun it when the spec changes.
- A Hybrid Object is **not a singleton**: each `createHybridObject` call creates a new instance with its own state. That's why it's created once and exported.
- `ArrayBuffer` crosses the bridge without copying, and callbacks are ordinary function parameters, so no event emitter is needed.
- `Promise.parallel { }` runs async work on a background thread.
- Pitfall: the template's `package.json` points `types` at `lib/index.d.ts`, which doesn't exist until you build. Pointing `main` at `src/index` fixes the "Cannot find module" error.

**Expo / project setup**
- With **Continuous Native Generation**, `ios/` and `android/` are generated and gitignored. Native changes go through `app.json` and config plugins, never by hand.
- iOS 27 requires the **UIScene life cycle**. `plugins/withSceneLifecycle.js` plus `UIApplicationSceneManifest` in `app.json` hand window creation to Expo's `EXExpoAppSceneDelegate`.
- Module build outputs (`android/build`, `.cxx`, `.gradle`) need to be gitignored, or a single build adds hundreds of changes.
- A `@/modules/*` path alias in `tsconfig.json` lets the app import local modules cleanly.

### Benchmark

The screen at `src/app/index.tsx` runs these cases against every toolkit and highlights the fastest:

| Case | What it measures |
|---|---|
| `add` × 10,000 | Call overhead |
| `sha256` × 1,000 | Short string round trip |
| `sha256Bytes` 1 MB × 5 | Binary transfer (`number[]` copy vs `ArrayBuffer`) |
| `sha256Iterated` 100,000 | Async path. The JS frame counter should keep running |
| ticker 10 ms for 1 s | Events received (ideal ≈ 100) |

It also checks that all three return the same hashes.

> Results: _to be filled in from a Release build._ Debug builds add overhead and skew the numbers.

### Running it

This app needs a **development build**. Expo Go doesn't include custom native code.

```bash
npm install
npx expo run:ios       # or: npx expo run:android
npx expo run:ios --configuration Release   # for benchmark numbers
```

Changing a spec:

```bash
# Turbo: codegen runs as part of the native build
npx expo prebuild --clean

# Nitro: regenerate specs, then rebuild
cd modules/nitro-hash-toolkit && npx nitrogen@0.37.1   # keep in sync with react-native-nitro-modules
```

**Stack:** Expo SDK 57 · React Native 0.86 · Expo Router · react-native-nitro-modules 0.37

---

## Türkçe

### Bu proje neden var

React Native'de bugün native modül yazmanın üç yolu var: **Expo Modules**, **Turbo Modules** ve **Nitro Modules**. Sadece okuyarak bir yere kadar anlaşılıyor. Bu yüzden bu projede **aynı modül üç kez**, her yaklaşımla bir kez yazıldı ve hepsi tek bir uygulamada yan yana kondu.

Her modül aynı küçük API'yi, yani `HashToolkit`'i implemente ediyor:

| Metot | Neden var |
|---|---|
| `add(a, b)` | Native tarafta neredeyse hiç iş yok, yani saf çağrı maliyetini ölçüyor |
| `sha256(text)` | Senkron, string girip string çıkıyor |
| `sha256Bytes(data)` | Binary veri aktarımı |
| `sha256Iterated(text, n)` | JS thread dışında async iş (Promise) |
| `startTicker` / `stopTicker` + `onTick` | Native'den JS'e event ve callback |

Ardından bir benchmark ekranı aynı iş yükünü üçünde de çalıştırıyor.

### Proje yapısı

```
modules/
  expo-hash-toolkit/    Expo Modules API (Swift + Kotlin DSL)
  turbo-hash-toolkit/   Turbo Module (TS spec → codegen, ObjC++ + Kotlin)
  nitro-hash-toolkit/   Nitro Module (TS spec → nitrogen, Swift + Kotlin)
src/
  toolkits/             Üçünü tek bir HashToolkit arayüzünün arkasına koyan adapter'lar
  benchmark/cases.ts    Benchmark senaryoları
  app/index.tsx         Benchmark ekranı
plugins/
  withSceneLifecycle.js iOS UIScene life cycle için config plugin
```

### Üç yaklaşım bir bakışta

| | Expo Modules | Turbo Modules | Nitro Modules |
|---|---|---|---|
| Doğruluk kaynağı | Swift/Kotlin DSL | TypeScript spec | TypeScript spec |
| Kod üretimi | Yok | Codegen (`pod install` / Gradle build sırasında) | `nitrogen` (elle çalıştırılıyor, çıktısı commit'leniyor) |
| iOS dili | Swift | Objective-C++ | Swift |
| Binary veri | `Uint8Array` | `number[]` (her byte kopyalanıyor) | `ArrayBuffer` (kopyasız) |
| Event | `sendEvent` + `addListener` | `EventEmitter` + `emitOnTick` | Düz callback parametresi |
| Instance | Singleton | Singleton | `createHybridObject`, istediğin kadar |
| Link'leme | `modules/` içinde `expo-module.config.json` | `package.json` dependency | `package.json` dependency |

### Neler öğrendik

**Expo Modules**
- En az tören gerektiren yol: spec dosyası yok, codegen yok. API'nin kendisi Swift/Kotlin `ModuleDefinition` DSL'i.
- `modules/` altındaki yerel modüller `expo-module.config.json` üzerinden otomatik link'leniyor, `package.json`'a eklemek gerekmiyor.
- `Uint8Array`, Promise ve event'ler (`Events` + `sendEvent`) kutudan çıktığı gibi destekleniyor.

**Turbo Modules**
- **TS spec doğruluk kaynağı.** Codegen ondan bir ObjC protocol'ü (`NativeTurboHashToolkitSpec`) ve abstract bir Kotlin/Java sınıfı üretiyor.
- Codegen **sadece arayüz** üretiyor. Senin dosyalarına metot iskeleti yazmıyor. Eşleşen imzaları sen yazıyorsun, uyuşmazlarsa derleyici söylüyor.
- Codegen `pod install` (iOS) ve Gradle build (Android) sırasında çalışıyor. CNG ile `npx expo prebuild --clean` de onu tetikliyor.
- Codegen `Uint8Array`/`ArrayBuffer` desteklemiyor. Byte'lar `ReadonlyArray<number>` olarak gidiyor ve tek tek kopyalanıyor.
- `CodegenTypes.EventEmitter<T>` (RN 0.76+) `NativeEventEmitter`'ın yerini alıyor. Bunu kullanınca üretilen iOS sınıfı `NativeTurboHashToolkitSpecBase`'den türüyor ve `emitOnTick` oradan geliyor.
- Thread'ler: senkron metotlar JS thread'inde çalışıyor. void/Promise metotlar iOS'ta modülün method queue'sunda, Android'de native modules thread'inde çalışıyor.

**Nitro Modules**
- `nitrogen` tek bir TS dosyasından C++, Swift ve Kotlin spec'leri üretiyor. Üretilen kod commit'leniyor, sadece spec değişince yeniden çalıştırılıyor.
- Hybrid Object **singleton değil**: her `createHybridObject` çağrısı kendi state'i olan yeni bir instance oluşturuyor. Bu yüzden bir kez oluşturulup export ediliyor.
- `ArrayBuffer` kopyalanmadan geçiyor. Callback'ler normal fonksiyon parametresi, event emitter'a gerek yok.
- `Promise.parallel { }` async işi arka plandaki bir thread'de çalıştırıyor.
- Tuzak: template'teki `package.json`, `types` alanını build edilene kadar var olmayan `lib/index.d.ts`'e yönlendiriyor. `main`'i `src/index`'e çevirmek "Cannot find module" hatasını çözüyor.

**Expo / proje kurulumu**
- **Continuous Native Generation** ile `ios/` ve `android/` üretiliyor ve gitignore'da duruyor. Native değişiklikler elle değil, `app.json` ve config plugin'lerle yapılıyor.
- iOS 27 **UIScene life cycle** zorunlu kılıyor. `plugins/withSceneLifecycle.js` ve `app.json`'daki `UIApplicationSceneManifest`, pencere oluşturmayı Expo'nun `EXExpoAppSceneDelegate`'ine bırakıyor.
- Modüllerin build çıktıları (`android/build`, `.cxx`, `.gradle`) gitignore'a eklenmeli, yoksa tek bir build yüzlerce değişiklik ekliyor.
- `tsconfig.json`'daki `@/modules/*` alias'ı, uygulamanın yerel modülleri temiz şekilde import etmesini sağlıyor.

### Benchmark

`src/app/index.tsx`'teki ekran bu senaryoları her toolkit'e karşı çalıştırıyor ve en hızlıyı vurguluyor:

| Senaryo | Neyi ölçüyor |
|---|---|
| `add` × 10.000 | Çağrı maliyeti |
| `sha256` × 1.000 | Kısa string gidiş-dönüş |
| `sha256Bytes` 1 MB × 5 | Binary aktarım (`number[]` kopyası vs `ArrayBuffer`) |
| `sha256Iterated` 100.000 | Async yol. JS frame sayacı durmamalı |
| ticker 10 ms, 1 sn | Alınan event sayısı (ideal ≈ 100) |

Ayrıca üçünün de aynı hash'leri döndürdüğünü kontrol ediyor.

> Sonuçlar: _Release build'den alınıp doldurulacak._ Debug build ek yük getirip sayıları çarpıtıyor.

### Çalıştırma

Bu uygulama bir **development build** gerektiriyor. Expo Go özel native kod içermiyor.

```bash
npm install
npx expo run:ios       # veya: npx expo run:android
npx expo run:ios --configuration Release   # benchmark sayıları için
```

Spec değiştirince:

```bash
# Turbo: codegen native build'in bir parçası olarak çalışıyor
npx expo prebuild --clean

# Nitro: spec'leri yeniden üret, sonra yeniden build al
cd modules/nitro-hash-toolkit && npx nitrogen@0.37.1   # keep in sync with react-native-nitro-modules
```

**Stack:** Expo SDK 57 · React Native 0.86 · Expo Router · react-native-nitro-modules 0.37
