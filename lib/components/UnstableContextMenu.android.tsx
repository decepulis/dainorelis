import { View } from 'react-native';

import { Button, ContextMenu as JetpackContextMenu } from '@expo/ui/jetpack-compose';

import { useThemeColor } from '../hooks/useThemeColor';
import { buttonSlop } from './Button';
import { ContextMenuAction, ContextMenuProps } from './ContextMenu';

export default function ContextMenu({ actions, children, title, hitSlop: argHitSlop, style }: ContextMenuProps) {
  const primary = useThemeColor('primary');
  const card = useThemeColor('card');
  const text = useThemeColor('text');

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
      <View style={hitSlopPadding}>
        <JetpackContextMenu>
          <JetpackContextMenu.Items>
            {actions.map((action: ContextMenuAction) => (
              <Button
                key={action.id}
                leadingIcon={(action.state === 'on' ? 'check_20px' : action.image) as any}
                disabled={action.disabled}
                onPress={action.onPress}
                elementColors={{
                  containerColor: primary,
                  contentColor: card,
                  disabledContainerColor: text,
                  disabledContentColor: card,
                }}
              >
                {action.title}
              </Button>
            ))}
          </JetpackContextMenu.Items>
          <JetpackContextMenu.Trigger>{children}</JetpackContextMenu.Trigger>
        </JetpackContextMenu>
      </View>
    </View>
  );
}
