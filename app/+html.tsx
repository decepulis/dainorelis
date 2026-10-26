import type { PropsWithChildren } from 'react';

import { ScrollViewStyleReset, useServerDocumentContext } from 'expo-router/html';

import { themeScript, themeStyle } from '@/lib/constants/webTheme';

// web only: the static HTML around every page. Expo's default, in Lithuanian
export default function Root({ children }: PropsWithChildren) {
  const { bodyAttributes, bodyNodes, htmlAttributes, headNodes } = useServerDocumentContext();
  return (
    // the script sets data-theme before hydration
    <html {...htmlAttributes} lang="lt" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        {/* Safari's Smart App Banner: the App Store app, or Open when it's installed */}
        <meta name="apple-itunes-app" content="app-id=1116436510" />
        <ScrollViewStyleReset />
        {/* the theme colors, and the reader's mode before the first paint (lib/constants/webTheme.ts) */}
        <style dangerouslySetInnerHTML={{ __html: themeStyle }} />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {headNodes}
      </head>
      <body {...bodyAttributes}>
        {children}
        {bodyNodes}
      </body>
    </html>
  );
}
