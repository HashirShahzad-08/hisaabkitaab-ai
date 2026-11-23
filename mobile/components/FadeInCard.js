// Fades in and slides up 12px, one after another (60ms apart). Uses Moti.
import { MotiView } from 'moti';

export default function FadeInCard({ index = 0, style, children }) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 12 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 350, delay: index * 60 }}
      style={style}
    >
      {children}
    </MotiView>
  );
}
