import tailwindcssAnimate from 'tailwindcss-animate';

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          hover: 'hsl(var(--primary-hover))',
          container: 'hsl(var(--primary-container))',
          'container-foreground': 'hsl(var(--on-primary-container))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
          container: 'hsl(var(--secondary-container))',
          'container-foreground': 'hsl(var(--on-secondary-container))'
        },
        tertiary: {
          DEFAULT: 'hsl(var(--tertiary))',
          foreground: 'hsl(var(--tertiary-foreground))',
          container: 'hsl(var(--tertiary-container))',
          'container-foreground': 'hsl(var(--on-tertiary-container))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        surface: {
          DEFAULT: 'hsl(var(--surface))',
          dim: 'hsl(var(--surface-dim))',
          bright: 'hsl(var(--surface-bright))',
          'container-lowest': 'hsl(var(--surface-container-lowest))',
          'container-low': 'hsl(var(--surface-container-low))',
          container: 'hsl(var(--surface-container))',
          'container-high': 'hsl(var(--surface-container-high))',
          'container-highest': 'hsl(var(--surface-container-highest))',
          tint: 'hsl(var(--surface-tint))',
          variant: 'hsl(var(--surface-variant))'
        },
        'on-surface': {
          DEFAULT: 'hsl(var(--on-surface))',
          variant: 'hsl(var(--on-surface-variant))'
        },
        outline: {
          DEFAULT: 'hsl(var(--outline))',
          variant: 'hsl(var(--outline-variant))'
        },
        'error-container': 'hsl(var(--error-container))',
        'on-error-container': 'hsl(var(--on-error-container))',
        // Kami 专用色
        parchment: 'hsl(var(--parchment))',
        ivory: 'hsl(var(--ivory))',
        'warm-sand': 'hsl(var(--warm-sand))',
        'ink-blue': 'hsl(var(--ink-blue))',
        olive: 'hsl(var(--olive))',
        stone: 'hsl(var(--stone))'
      },
      borderRadius: {
        // Kami 圆角尺度
        none: '0px',
        tight: '4px',
        code: '6px',
        DEFAULT: 'var(--radius)',
        md: 'calc(var(--radius) + 0.125rem)',
        lg: '8px',
        xl: '12px',
        '2xl': '16px',
        '3xl': '24px',
        '4xl': '32px'
      },
      fontFamily: {
        // Kami: serif 承担层级，sans 承担功能，mono 代码
        serif: ['Charter', 'Source Han Serif SC', 'Noto Serif SC', 'Georgia', 'serif'],
        sans: ['Inter', 'PingFang SC', 'Noto Sans SC', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'monospace']
      },
      fontSize: {
        // Kami 层级 · 印刷 PT × 1.33 ≈ 屏幕 PX
        'display': ['48px', { lineHeight: '1.1', fontWeight: '500', letterSpacing: '-0.02em' }],
        'display-sm': ['36px', { lineHeight: '1.15', fontWeight: '500', letterSpacing: '-0.01em' }],
        'section': ['24px', { lineHeight: '1.2', fontWeight: '500', letterSpacing: '0' }],
        'subsection': ['18px', { lineHeight: '1.25', fontWeight: '500', letterSpacing: '0' }],
        'item': ['15px', { lineHeight: '1.3', fontWeight: '500', letterSpacing: '0' }],
        'body-lg': ['18px', { lineHeight: '1.55', fontWeight: '400' }],
        'body': ['15px', { lineHeight: '1.55', fontWeight: '400' }],
        'body-dense': ['13px', { lineHeight: '1.4', fontWeight: '400' }],
        'caption': ['13px', { lineHeight: '1.45', fontWeight: '400' }],
        'label': ['12px', { lineHeight: '1.35', fontWeight: '600', letterSpacing: '0.03em' }],
        'label-sm': ['11px', { lineHeight: '1.35', fontWeight: '600', letterSpacing: '0.05em' }]
      },
      spacing: {
        // Kami 4pt 基础单位节奏
        'container-padding': '32px',
        'window-padding': '24px',
        'sidebar-width': '260px',
        unit: '4px',
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '40px',
        '2xl': '60px',
        '3xl': '120px',
        gutter: '16px',
        'stack-sm': '8px',
        'stack-md': '12px',
        'stack-lg': '24px'
      },
      boxShadow: {
        // Kami 阴影三法：ring / whisper，不用硬投影
        ring: '0 0 0 1px hsl(var(--ring-warm))',
        whisper: '0 4px 24px rgba(0,0,0,0.05)',
        'whisper-lg': '0 8px 32px rgba(0,0,0,0.06)'
      },
      backdropBlur: {
        sidebar: '20px'
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' }
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' }
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out'
      }
    }
  },
  plugins: [tailwindcssAnimate]
};
