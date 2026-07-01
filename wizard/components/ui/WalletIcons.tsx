export function KeplrIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="40"
      height="40"
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="keplr-grad" x1="20" y1="0" x2="20" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#00C9E1" />
          <stop offset="1" stopColor="#2841E3" />
        </linearGradient>
        <radialGradient id="keplr-glow" cx="0.95" cy="1" r="0.6">
          <stop stopColor="#8463FE" stopOpacity="0.8" />
          <stop offset="1" stopColor="#8463FE" stopOpacity="0" />
        </radialGradient>
        <clipPath id="keplr-clip">
          <rect width="40" height="40" rx="8" />
        </clipPath>
      </defs>
      <g clipPath="url(#keplr-clip)">
        <rect width="40" height="40" fill="url(#keplr-grad)" />
        <circle cx="38" cy="40" r="14" fill="url(#keplr-glow)" />
        <path
          d="M15.9796 30.9091V21.6483L24.8136 30.9091H29.7273V30.6688L19.5675 20.1255L28.9436 10.1202V10H23.9983L15.9796 18.8411V10H12V30.9091H15.9796Z"
          fill="#FFFFFF"
        />
      </g>
    </svg>
  );
}

export function MetaMaskIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="40"
      height="40"
      viewBox="0 0 212 189"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g fill="none" fillRule="evenodd">
        <polygon fill="#CDBDB2" points="60.75 173.25 88.313 180.563 88.313 171 90.563 168.75 106.313 168.75 106.313 180 106.313 187.875 89.438 187.875 68.625 178.875" />
        <polygon fill="#CDBDB2" points="105.75 173.25 132.75 180.563 132.75 171 135 168.75 150.75 168.75 150.75 180 150.75 187.875 133.875 187.875 113.063 178.875" transform="matrix(-1 0 0 1 256.5 0)" />
        <polygon fill="#393939" points="90.563 152.438 88.313 171 91.125 168.75 120.375 168.75 123.75 171 121.5 152.438 117 149.625 94.5 150.188" />
        <polygon fill="#F89C35" points="75.375 27 88.875 58.5 95.063 150.188 117 150.188 123.75 58.5 136.125 27" />
        <polygon fill="#F89D35" points="16.313 96.188 .563 141.75 39.938 139.5 65.25 139.5 65.25 119.813 64.125 79.313 58.5 83.813" />
        <polygon fill="#D87C30" points="46.125 101.25 92.25 102.375 87.188 126 65.25 120.375" />
        <polygon fill="#EA8D3A" points="46.125 101.813 65.25 119.813 65.25 137.813" />
        <polygon fill="#F89D35" points="65.25 120.375 87.75 126 95.063 150.188 90 153 65.25 138.375" />
        <polygon fill="#EB8F35" points="65.25 138.375 60.75 173.25 90.563 152.438" />
        <polygon fill="#EA8E3A" points="92.25 102.375 95.063 150.188 86.625 125.719" />
        <polygon fill="#D87C30" points="39.375 138.938 65.25 138.375 60.75 173.25" />
        <polygon fill="#EB8F35" points="12.938 188.438 60.75 173.25 39.375 138.938 .563 141.75" />
        <polygon fill="#E8821E" points="88.875 58.5 64.688 78.75 46.125 101.25 92.25 102.938" />
        <polygon fill="#DFCEC3" points="60.75 173.25 90.563 152.438 88.313 170.438 88.313 180.563 68.063 176.625" />
        <polygon fill="#DFCEC3" points="121.5 173.25 150.75 152.438 148.5 170.438 148.5 180.563 128.25 176.625" transform="matrix(-1 0 0 1 272.25 0)" />
        <polygon fill="#393939" points="70.313 112.5 64.125 125.438 86.063 119.813" transform="matrix(-1 0 0 1 150.188 0)" />
        <polygon fill="#E88F35" points="12.375 .563 88.875 58.5 75.938 27" />
        <path fill="#8E5A30" d="M12.375 0.563L2.25 31.5 7.875 65.25 3.938 67.5 9.563 72.563 5.063 76.5 11.25 82.125 7.313 85.5 16.313 96.75 58.5 83.813C79.125 67.313 89.25 58.875 88.875 58.5 88.5 58.125 63 38.813 12.375 0.563Z" />
        <g transform="matrix(-1 0 0 1 211.5 0)">
          <polygon fill="#F89D35" points="16.313 96.188 .563 141.75 39.938 139.5 65.25 139.5 65.25 119.813 64.125 79.313 58.5 83.813" />
          <polygon fill="#D87C30" points="46.125 101.25 92.25 102.375 87.188 126 65.25 120.375" />
          <polygon fill="#EA8D3A" points="46.125 101.813 65.25 119.813 65.25 137.813" />
          <polygon fill="#F89D35" points="65.25 120.375 87.75 126 95.063 150.188 90 153 65.25 138.375" />
          <polygon fill="#EB8F35" points="65.25 138.375 60.75 173.25 90 153" />
          <polygon fill="#EA8E3A" points="92.25 102.375 95.063 150.188 86.625 125.719" />
          <polygon fill="#D87C30" points="39.375 138.938 65.25 138.375 60.75 173.25" />
          <polygon fill="#EB8F35" points="12.938 188.438 60.75 173.25 39.375 138.938 .563 141.75" />
          <polygon fill="#E8821E" points="88.875 58.5 64.688 78.75 46.125 101.25 92.25 102.938" />
          <polygon fill="#393939" points="70.313 112.5 64.125 125.438 86.063 119.813" transform="matrix(-1 0 0 1 150.188 0)" />
          <polygon fill="#E88F35" points="12.375 .563 88.875 58.5 75.938 27" />
          <path fill="#8E5A30" d="M12.375 0.563L2.25 31.5 7.875 65.25 3.938 67.5 9.563 72.563 5.063 76.5 11.25 82.125 7.313 85.5 16.313 96.75 58.5 83.813C79.125 67.313 89.25 58.875 88.875 58.5 88.5 58.125 63 38.813 12.375 0.563Z" />
        </g>
      </g>
    </svg>
  );
}
