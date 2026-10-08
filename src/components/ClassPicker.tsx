import { useLocalized, useT } from '../i18n/use-t';
import { selectClasses } from '../store/selectors';
import { useBuild } from '../store/use-build';
import { GameIcon } from './GameIcon';

/** The 6 Classes as a radio group of icon tiles. */
export function ClassPicker() {
  const t = useT();
  const local = useLocalized();
  const classes = useBuild(selectClasses);
  const classId = useBuild((state) => state.inputs.classId);
  const setClass = useBuild((state) => state.setClass);

  return (
    <fieldset>
      <legend className="mb-2 text-xs font-medium tracking-wider text-muted uppercase">
        {t('classLabel')}
      </legend>
      <div className="grid grid-cols-3 gap-1.5">
        {classes.map((cls) => {
          const checked = cls.id === classId;
          return (
            <label
              key={cls.id}
              className={`group flex cursor-pointer flex-col items-center gap-1 rounded-ui border px-1 py-2 text-center text-xs transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent ${
                checked
                  ? 'border-accent bg-panel-2 text-text'
                  : 'border-line text-muted hover:border-line-strong hover:text-text'
              }`}
            >
              <input
                type="radio"
                name="class"
                className="sr-only"
                checked={checked}
                onChange={() => setClass(cls.id)}
              />
              <GameIcon
                id={cls.iconId}
                className={`size-8 transition-opacity ${checked ? 'opacity-100' : 'opacity-60 group-hover:opacity-90'}`}
              />
              <span className="leading-tight">{local(cls.name)}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
