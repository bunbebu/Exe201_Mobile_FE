# Hướng dẫn Build file APK cho dự án Expo React Native

Dự án `Exe201_Mobile_FE` được phát triển trên nền tảng **Expo**. Để xuất/build ra file cài đặt `.apk` cho Android, cách chuẩn và phổ biến nhất hiện nay là sử dụng **EAS Build** (Expo Application Services). 

Dưới đây là các bước từ đầu đến cuối:

---

## Cách 1: Build trên Cloud của Expo (Đề xuất)
Cách này sẽ gửi gói mã nguồn của bạn lên máy chủ của Expo để thực hiện đóng gói, sau đó trả về cho bạn link tải file APK. Rất tiện lợi vì không yêu cầu máy tính của bạn phải tải Android SDK hay Android Studio nặng nề.

### Bước 1: Cài đặt công cụ EAS CLI
Mở lệnh trên Terminal/CMD và chạy lệnh sau để cài đặt EAS CLI gốc (Global) trên máy tính:
```bash
npm install -g eas-cli
```

### Bước 2: Đăng nhập tài khoản Expo
Bạn cần có một tài khoản miễn phí tại [https://expo.dev](https://expo.dev/). Hãy tạo một tài khoản, sau đó trở lại terminal và gõ:
```bash
eas login
```
(_Bạn điền Username / Password như tài khoản vừa tạo_).

### Bước 3: Khởi tạo cấu hình EAS
Chạy lệnh dùng để khởi tạo dịch vụ EAS trong dự án:
```bash
eas build:configure
```
- Khi được hỏi về Platform, hãy chọn **Android**.

### Bước 4: Cấu hình để buộc xuất file `.apk`
Mặc định, Expo xây dựng bản Production (sản xuất) ra dạng tệp `.aab` (để dùng up lên Google Play). Để có thể gửi file chạy trực tiếp (`.apk`), hãy mở file `eas.json` vừa được tạo ra ở thư mục dự án và sửa block `preview` thành thế này:

```json
{
  "cli": {
    "version": ">= 3.8.1"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "android": {
        "buildType": "apk"
      }
    },
    "production": {}
  }
}
```

### Bước 5: Chạy lệnh Build APK
Khởi chạy tiến trình đóng gói trên máy chủ Expo bằng lệnh sau:
```bash
eas build -p android --profile preview
```
**Chờ đợi:** 
- Quá trình này sẽ mất một lúc (tầm 10 - 20 phút tuỳ vào Server tại thời điểm đó). 
- Khi quá trình thành công, Terminal sẽ trả về hiển thị **1 đường dẫn Link (URL)** cài đặt và **mã QR code**. Qua đó, bạn có thể chép tải trực tiếp file `.apk` để kiểm tra.

---

## Cách 2: Build Local (Tại Máy tính cá nhân)
Nếu bạn không muốn chờ xếp hàng trên Cloud Expo, hoặc máy tính bạn đủ mạnh và đã cài sẵn **Android Studio / Java JDK / SDK**, bạn có thể build tại nội bộ máy tính của bạn.

**Cú pháp:**
```bash
eas build -p android --profile preview --local
```
Lúc này máy bạn sẽ chạy local Fastlane / Gradle để đóng gói app. Khi xong, hệ thống sẽ tự động sinh tệp tin `build-xxx.apk` ngay bên trong thư mục `c:\PRJ\PRM\Exe201_Mobile_FE\`.
