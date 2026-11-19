/**
 * Per-case UI state shared by the case file, the board and the notebook:
 * provided by GameScreen, injected by its children.
 */
import { inject, provide, reactive, ref, type InjectionKey, type Ref } from 'vue'
import { emptyBoard, type BoardState } from '../game/board'
import { emptyMarks, type Marks } from '../game/notebook'

export interface CaseSession {
  board: Ref<BoardState>
  /** Reactive and mutated in place (see cycleMark). */
  marks: Marks
}

const KEY: InjectionKey<CaseSession> = Symbol('caseSession')

export function provideCaseSession(size: number): CaseSession {
  const session: CaseSession = { board: ref(emptyBoard(size)), marks: reactive(emptyMarks(size)) }
  provide(KEY, session)
  return session
}

export function useCaseSession(): CaseSession {
  const session = inject(KEY)
  if (!session) throw new Error('useCaseSession() needs provideCaseSession() in an ancestor')
  return session
}
