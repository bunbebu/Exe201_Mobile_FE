import { Text, View, useColorScheme } from 'react-native';

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: isDark ? '#000' : '#fff',
      }}
    >
      <Text
        style={{
          fontSize: 24,
          fontWeight: 'bold',
          color: isDark ? '#fff' : '#000',
        }}
      >
        EduTech Mobile App
      </Text>

      <Text
        style={{
          marginTop: 8,
          color: isDark ? '#ddd' : '#333',
        }}
      >
        React Native chạy rồi 🎉
      </Text>
    </View>
  );
}
