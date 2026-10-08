import type { AttributeId } from '../domain/types';
import { useBuild } from '../store/use-build';

/** Adds the Attribute as a Target, or removes it if it already is one. */
export function useTargetToggle(): (attribute: AttributeId) => void {
  const targets = useBuild((state) => state.inputs.targets);
  const addTarget = useBuild((state) => state.addTarget);
  const removeTarget = useBuild((state) => state.removeTarget);
  return (attribute) =>
    targets.some((target) => target.attribute === attribute)
      ? removeTarget(attribute)
      : addTarget(attribute);
}
