import { MotionConfig, useReducedMotion } from 'motion/react';
import { useEffect } from 'react';
import { useBuild } from '../store/use-build';
import { ClassPicker } from './ClassPicker';
import { useDesign } from './design';
import { Header } from './Header';
import { Paperdoll } from './Paperdoll';
import { PhoneCalculateBar } from './PhoneCalculateBar';
import { QualityPicker } from './QualityPicker';
import { Summary } from './Summary';
import { TargetsPanel } from './TargetsPanel';
import { TopUpControls } from './TopUpControls';

/**
 * The build editor (ADR-0005): inputs on the left, the doll in the middle,
 * cost and Calculate on the right. Under md the three stack.
 */
export function App() {
  const language = useBuild((state) => state.language);
  const [design, setDesign] = useDesign();
  const reduce = useReducedMotion();
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return (
    <MotionConfig
      reducedMotion="user"
      transition={reduce ? { duration: 0 } : { duration: 0.2, ease: 'easeOut' }}
    >
      <div className="mx-auto flex min-h-screen max-w-[90rem] flex-col gap-4 px-4 pt-4 pb-24 sm:px-6 xl:pb-6 lg:pt-6">
        <Header design={design} onDesign={setDesign} />
        <main className="grid grid-cols-1 items-start gap-4 md:grid-cols-[minmax(18rem,22rem)_1fr] xl:grid-cols-[minmax(19rem,23rem)_1fr_minmax(17rem,20rem)]">
          <aside className="panel space-y-5 p-4 md:row-span-2 xl:row-span-1">
            <ClassPicker />
            <QualityPicker />
            <TargetsPanel />
            <TopUpControls />
          </aside>
          <div className="panel p-3 sm:p-4">
            <Paperdoll />
          </div>
          <div className="panel p-4 xl:sticky xl:top-4">
            <Summary />
          </div>
        </main>
      </div>
      <PhoneCalculateBar />
    </MotionConfig>
  );
}
