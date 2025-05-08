import React, { startTransition, useCallback, useState } from 'react';
import { LayoutChangeEvent, LayoutRectangle, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useAnimatedRef, useSharedValue } from 'react-native-reanimated';
import { AnimatedScrollView } from 'react-native-reanimated/lib/typescript/component/ScrollView';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Image } from 'expo-image';
import { Link, Stack } from 'expo-router';

import { FontAwesome6 } from '@expo/vector-icons';
import { useHeaderHeight } from '@react-navigation/elements';

import Button from '@/lib/components/Button';
import { HeaderBackground, HeaderButtonContainer, HeaderTitle } from '@/lib/components/Header';
import HeaderLogo from '@/lib/components/Index/HeaderLogo';
import List from '@/lib/components/Index/List';
import Results from '@/lib/components/Index/Results';
import Search from '@/lib/components/Index/Search';
import { margin, padding } from '@/lib/components/Index/constants';
import ScrollViewWithHeader from '@/lib/components/ScrollViewWithHeader';
import SystemView from '@/lib/components/SystemView';
import maxWidth from '@/lib/constants/maxWidth';
import { useDidImagesLoad } from '@/lib/hooks/useDidImagesLoad';
import { useThemeColor } from '@/lib/hooks/useThemeColor';

export default function Index() {
  // just a bunch of global state
  const inset = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const headerHeight = useHeaderHeight();
  const { setDidBackgroundLoad, setDidLogoLoad } = useDidImagesLoad();
  const card0 = useThemeColor('card0');

  // some heights and stuff we need to know for layout and animation
  const [searchHeight, setSearchHeight] = useState(80); // Default initial value
  const scrollRef = useAnimatedRef<AnimatedScrollView>();
  const titleLayout = useSharedValue<LayoutRectangle | null>(null);
  const calculateTitleHeight = useCallback(
    (event: LayoutChangeEvent) => {
      titleLayout.value = event.nativeEvent.layout;
    },
    [titleLayout]
  );

  // set up stuff for search results
  const [filter, setFilter] = useState<'allSongs' | 'favoriteSongs'>('allSongs');
  const [searchText, setSearchText] = useState('');

  // we could do this with css aspect ratio, but we need the height for other reasons...
  const logoContainerAspectRatio = 747 / 177;
  const logoContainerWidth = Math.min(width - 80, 360);
  const logoContainerHeight = logoContainerWidth / logoContainerAspectRatio;
  const logoContainerPaddingTop = 80 + inset.top - headerHeight;
  const logoContainerPaddingBottom = 80 + padding;
  const searchHeightWithPadding = searchHeight + padding - padding / 4;

  return (
    <>
      <Stack.Screen
        options={{
          headerBackground: () => <HeaderBackground scrollRef={scrollRef} shadow={false} />,
          headerTitleAlign: 'center',
          headerTitle: ({ children }) => (
            <HeaderTitle scrollRef={scrollRef} titleLayout={titleLayout}>
              {children || <HeaderLogo headerHeight={headerHeight} onLoadEnd={() => setDidLogoLoad(true)} />}
            </HeaderTitle>
          ),
          headerRight: () => (
            <HeaderButtonContainer>
              <Link href="/nustatymai" asChild>
                <Button>
                  <FontAwesome6 name="sliders" size={14} color="#fff" />
                </Button>
              </Link>
            </HeaderButtonContainer>
          ),
        }}
      />
      <View style={[styles.container, { backgroundColor: card0 }]}>
        <Image
          style={{ position: 'absolute', top: 0, left: 0, right: 0, height }}
          source={require('@/assets/images/miskas_fade_9.png')}
          onLoadEnd={() => setDidBackgroundLoad(true)}
          contentFit="cover"
          contentPosition="bottom"
        ></Image>
        {/* TODO enable keyboardDismissMode="interactive" when keyboard padding isn't so janky */}
        <ScrollViewWithHeader keyboardDismissMode="on-drag" ref={scrollRef} stickyHeaderIndices={[1]}>
          <View
            onLayout={calculateTitleHeight}
            style={[
              styles.logoContainer,
              {
                marginTop: logoContainerPaddingTop,
                marginBottom: logoContainerPaddingBottom,
                width: logoContainerWidth,
                height: logoContainerHeight,
              },
            ]}
          >
            <Image
              style={StyleSheet.absoluteFillObject}
              source={require('@/assets/images/logo_white.png')}
              contentFit="contain"
              onLoadEnd={() => setDidLogoLoad(true)}
            />
          </View>
          <Search
            scrollRef={scrollRef}
            filter={filter}
            setFilter={setFilter}
            searchText={searchText}
            setSearchText={(text) => startTransition(() => setSearchText(text))}
            setSearchHeight={setSearchHeight}
            margin={margin}
            padding={padding}
          />
          <View style={{ width: '100%', maxWidth: maxWidth, marginHorizontal: 'auto' }}>
            <SystemView
              variant="background"
              style={[
                styles.blurContainer,
                {
                  marginBottom: Math.max(inset.bottom, margin),
                  minHeight:
                    height -
                    headerHeight -
                    logoContainerPaddingTop -
                    logoContainerHeight -
                    logoContainerPaddingBottom -
                    inset.bottom,
                  marginTop: -searchHeightWithPadding,
                  paddingTop: searchHeightWithPadding,
                },
              ]}
            >
              {searchText.length > 2 ? <Results searchText={searchText} filter={filter} /> : <List filter={filter} />}
            </SystemView>
          </View>
        </ScrollViewWithHeader>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  logoContainer: {
    marginHorizontal: 'auto',
    position: 'relative',
  },
  blurContainer: {
    marginHorizontal: margin,
    borderRadius: 20,
    overflow: 'hidden',
  },
});
