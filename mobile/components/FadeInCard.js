// Fades in and slides up 12px once, one after another (80ms apart). Uses Moti.
import { MotiView } from 'moti';

export default function FadeInCard({ index = 0, style, children }) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 12 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 350, delay: index * 80 }}
      style={style}
    >
      {children}
    </MotiView>
  );
}
