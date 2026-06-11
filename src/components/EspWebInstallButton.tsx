import { useEffect, useRef } from "react";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "esp-web-install-button": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & { manifest?: string },
        HTMLElement
      >;
    }
  }
}

type Props = {
  manifestUrl: string | null;
  label?: string;
};

export function EspWebInstallButton({ manifestUrl, label = "Перепрошить через USB" }: Props) {
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    const script = document.createElement("script");
    script.type = "module";
    script.src =
      "https://unpkg.com/esp-web-tools@10.2.1/dist/web/install-button.js?module";
    document.head.appendChild(script);
  }, []);

  if (!manifestUrl) {
    return null;
  }

  return (
    <esp-web-install-button manifest={manifestUrl}>{label}</esp-web-install-button>
  );
}

export function isWebSerialSupported(): boolean {
  return typeof navigator !== "undefined" && "serial" in navigator;
}
