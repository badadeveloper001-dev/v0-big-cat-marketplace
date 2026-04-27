import { StatusBar } from "expo-status-bar"
import { useMemo } from "react"
import { SafeAreaView, StyleSheet } from "react-native"
import { WebView } from "react-native-webview"

const FALLBACK_URL = "https://v0-big-cat-marketplace.vercel.app"

export default function App() {
  const appUrl = useMemo(() => {
    const configured = process.env.EXPO_PUBLIC_API_BASE_URL?.trim()
    if (!configured) return FALLBACK_URL
    return configured.endsWith("/") ? configured.slice(0, -1) : configured
  }, [])

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <WebView
        source={{ uri: appUrl }}
        startInLoadingState
        javaScriptEnabled
        domStorageEnabled
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        setSupportMultipleWindows={false}
        bounces={false}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
})
