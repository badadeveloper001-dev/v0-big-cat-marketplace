import { StatusBar } from "expo-status-bar"
import { useMemo, useRef, useState } from "react"
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native"
import { WebView } from "react-native-webview"

const FALLBACK_URL = "https://v0-big-cat-marketplace.vercel.app"

export default function App() {
  const webViewRef = useRef<WebView>(null)
  const [canGoBack, setCanGoBack] = useState(false)
  const [canGoForward, setCanGoForward] = useState(false)
  const [error, setError] = useState("")

  const appUrl = useMemo(() => {
    const configured = process.env.EXPO_PUBLIC_API_BASE_URL?.trim()
    if (!configured) return FALLBACK_URL
    return configured.endsWith("/") ? configured.slice(0, -1) : configured
  }, [])

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <View style={styles.titleWrap}>
          <Text style={styles.title}>BigCat Marketplace</Text>
          <Text style={styles.subtitle}>Full mobile preview of the live web app</Text>
        </View>
        <Pressable style={styles.reloadButton} onPress={() => webViewRef.current?.reload()}>
          <Text style={styles.reloadButtonText}>Reload</Text>
        </Pressable>
      </View>

      <View style={styles.toolbar}>
        <Pressable
          style={[styles.toolbarButton, !canGoBack && styles.toolbarButtonDisabled]}
          onPress={() => webViewRef.current?.goBack()}
          disabled={!canGoBack}
        >
          <Text style={styles.toolbarButtonText}>Back</Text>
        </Pressable>

        <Pressable
          style={[styles.toolbarButton, !canGoForward && styles.toolbarButtonDisabled]}
          onPress={() => webViewRef.current?.goForward()}
          disabled={!canGoForward}
        >
          <Text style={styles.toolbarButtonText}>Forward</Text>
        </Pressable>

        <View style={styles.urlPill}>
          <Text style={styles.urlText} numberOfLines={1}>
            {appUrl}
          </Text>
        </View>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.webviewContainer}>
        <WebView
          ref={webViewRef}
          source={{ uri: appUrl }}
          onLoadStart={() => setError("")}
          onError={(event) => {
            setError(event.nativeEvent.description || "Failed to load the web app")
          }}
          onNavigationStateChange={(state) => {
            setCanGoBack(state.canGoBack)
            setCanGoForward(state.canGoForward)
          }}
          startInLoadingState
          javaScriptEnabled
          domStorageEnabled
          sharedCookiesEnabled
          thirdPartyCookiesEnabled
          allowsBackForwardNavigationGestures
          scalesPageToFit={true}
          scrollEnabled={true}
          bounces={false}
          showsVerticalScrollIndicator={true}
          showsHorizontalScrollIndicator={false}
          renderLoading={() => (
            <View style={styles.loadingOverlay}>
              <Text style={styles.loadingTitle}>Loading BigCat mobile preview...</Text>
              <Text style={styles.loadingBody}>This loads the full live web app inside the native shell.</Text>
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f2f5fa",
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  titleWrap: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0a1a2f",
  },
  subtitle: {
    fontSize: 13,
    color: "#4d5c75",
    marginTop: 2,
  },
  reloadButton: {
    backgroundColor: "#0046ff",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  reloadButtonText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 13,
  },
  toolbar: {
    paddingHorizontal: 16,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  toolbarButton: {
    backgroundColor: "#ffffff",
    borderColor: "#d7deea",
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  toolbarButtonDisabled: {
    opacity: 0.5,
  },
  toolbarButtonText: {
    color: "#0a1a2f",
    fontSize: 13,
    fontWeight: "700",
  },
  urlPill: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderColor: "#d7deea",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  urlText: {
    color: "#4d5c75",
    fontSize: 12,
  },
  errorBox: {
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#ffe7e8",
    borderWidth: 1,
    borderColor: "#fec5ca",
  },
  errorText: {
    color: "#a30f24",
    fontSize: 13,
    fontWeight: "600",
  },
  webviewContainer: {
    flex: 1,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#d7deea",
    backgroundColor: "#ffffff",
  },
  loadingOverlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    backgroundColor: "#ffffff",
  },
  loadingTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0a1a2f",
    textAlign: "center",
    marginBottom: 6,
  },
  loadingBody: {
    fontSize: 13,
    color: "#4d5c75",
    textAlign: "center",
  },
})
