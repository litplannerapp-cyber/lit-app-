import { pointerWithin, closestCenter } from "@dnd-kit/core";

/* dnd-kit's own recommended pattern for a sortable grid that also has
   non-sortable drop zones of a different shape (here: the "move out of
   this board" strip, and board tiles acting as drop targets for loose
   items). closestCenter alone compares the DRAGGED NODE's rect-center to
   each droppable's center — since every grip handle sits in a tile's
   corner, not its middle, the dragged node's center is offset from the
   actual cursor by that same amount, which makes a wide, differently
   shaped target (the move-out strip) register as "closest" inconsistently.
   Checking literally whether the pointer is inside a target first removes
   that offset; closestCenter is only the fallback, for when the pointer is
   over a gap between tiles rather than any target (keyboard-driven drags
   included — dnd-kit tracks a virtual pointer position for those too). */
export function pointerWithinOrClosestCenter(args) {
  const pointerCollisions = pointerWithin(args);
  if (pointerCollisions.length > 0) return pointerCollisions;
  return closestCenter(args);
}
