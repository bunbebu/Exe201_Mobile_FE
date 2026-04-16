const FACEBOOK_APP_ID = "1634051867256995";
const FACEBOOK_CLIENT_TOKEN = ""; // Điền Client Token của bạn vào đây nếu cần thiết
const API_BASE_URL = "https://rest-api-edu-tech-with-nestjs-mongo.vercel.app";
const GOOGLE_WEB_CLIENT_ID = "464233585984-02gol93vhihdrfrt8ci1uucf5e3g26d6.apps.googleusercontent.com";

export default {
  expo: {
    name: "mobile-app",
    slug: "mobile-app",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "mobileapp",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.mobileapp.exe201",
    },
    android: {
      package: "com.mobileapp.exe201",
      adaptiveIcon: {
        backgroundColor: "#E6F4FE",
        foregroundImage: "./assets/images/android-icon-foreground.png",
        backgroundImage: "./assets/images/android-icon-background.png",
        monochromeImage: "./assets/images/android-icon-monochrome.png",
      },
    },
    web: {
      output: "static",
      favicon: "./assets/images/favicon.png",
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff",
          dark: {
            backgroundColor: "#000000",
          },
        },
      ],
      // Google Sign-In: Plugin chỉ cần cho iOS (URL scheme).
      // Android hoạt động không cần plugin — không thêm vào đây để tránh lỗi build.
      // Facebook native SDK
      [
        "react-native-fbsdk-next",
        {
          appID: FACEBOOK_APP_ID,
          clientToken: FACEBOOK_CLIENT_TOKEN,
          displayName: "BachKhoaViet",
          scheme: `fb${FACEBOOK_APP_ID}`,
          advertiserIDCollectionEnabled: false,
          autoLogAppEventsEnabled: false,
          isAutoInitEnabled: true,
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      apiBaseUrl: API_BASE_URL,
      googleWebClientId: GOOGLE_WEB_CLIENT_ID,
      facebookAppId: FACEBOOK_APP_ID,
      eas: {
        projectId: "c531fb89-f089-4b92-bd10-3e7728336cb1",
      },
    },
  },
};
