import { View } from 'react-native';

import { Button as SwiftUIButton, ContextMenu as SwiftUIContextMenu, Host as SwiftUIHost } from '@expo/ui/swift-ui';

import { buttonSlop } from './Button';
import { ContextMenuAction, ContextMenuProps } from './ContextMenu';

export default function ContextMenu({ actions, children, hitSlop: argHitSlop, style }: ContextMenuProps) {
  const hitSlop = {
    ...buttonSlop,
    ...argHitSlop,
  };
  const hitSlopMargin = {
    marginLeft: -hitSlop.left,
    marginRight: -hitSlop.right,
    marginTop: -hitSlop.top,
    marginBottom: -hitSlop.bottom,
  };
  const hitSlopPadding = {
    paddingLeft: hitSlop.left,
    paddingRight: hitSlop.right,
    paddingTop: hitSlop.top,
    paddingBottom: hitSlop.bottom,
  };

  return (
    <View style={[hitSlopMargin, style]}>
      <View style={[hitSlopPadding]}>
        <SwiftUIHost matchContents>
          <SwiftUIContextMenu activationMethod="singlePress">
            <SwiftUIContextMenu.Items>
              {actions.map((action: ContextMenuAction) => (
                <SwiftUIButton
                  key={action.id}
                  systemImage={action.image as any}
                  disabled={action.disabled}
                  onPress={action.onPress}
                >
                  {action.state === 'on' ? '✓ ' : ''}
                  {action.title}
                </SwiftUIButton>
              ))}
            </SwiftUIContextMenu.Items>
            <SwiftUIContextMenu.Trigger>{children}</SwiftUIContextMenu.Trigger>
          </SwiftUIContextMenu>
        </SwiftUIHost>
      </View>
    </View>
  );
}
