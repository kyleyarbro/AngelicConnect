const asset = (path) => new URL(path, import.meta.url).href;

export const brandingAssets = {
  template: {
    logoMarkUrl: asset("../assets/branding/template/logo-mark.svg"),
    wordmarkUrl: asset("../assets/branding/template/wordmark.svg")
  },
  angelic: {
    logoMarkUrl: asset("../assets/branding/angelic/logo-mark.svg"),
    wordmarkUrl: asset("../assets/branding/angelic/wordmark.svg")
  },
  shadowpoint: {
    logoMarkUrl: asset("../assets/branding/shadowpoint/logo-mark.svg"),
    wordmarkUrl: asset("../assets/branding/shadowpoint/wordmark.svg")
  }
};
