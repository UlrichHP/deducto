import {
  Amphora,
  Church,
  Cigarette,
  Crosshair,
  Flame,
  FlaskConical,
  Frame,
  LibraryBig,
  Mail,
  Ribbon,
  Spline,
  Sprout,
  Telescope,
  Wine,
} from 'lucide-vue-next'
import type { Component } from 'vue'
import type { ItemId, RoomId } from '../../game/data'

export const ROOM_ICONS: Record<RoomId, Component> = {
  observatory: Telescope,
  greenhouse: Sprout,
  wineCellar: Wine,
  smokingRoom: Cigarette,
  gallery: Frame,
  chapel: Church,
  library: LibraryBig,
}

export const ITEM_ICONS: Record<ItemId, Component> = {
  poker: Flame,
  arsenic: FlaskConical,
  letterOpener: Mail,
  scarf: Ribbon,
  statuette: Amphora,
  pistol: Crosshair,
  cord: Spline,
}
