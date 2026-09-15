import * as THREE from "three"
import type { ReleasePhase } from "../releases"
import { buildUfo, stepUfo } from "./ufo"

const STRENGTH: Record<ReleasePhase, number> = {
  scheduled: 0.24,
  queued: 0.4,
  testing: 0.56,
  deploying: 1,
  verifying: 0.84,
  succeeded: 0.46,
  failed: 0.92,
}

/** A release turns the farm's usual little saucer into a distant mothership and electrical storm. */
export function createReleaseRig(scene: THREE.Scene) {
  const ship = buildUfo()
  ship.group.position.set(12, 42, -24)
  ship.group.scale.setScalar(2.2)
  scene.add(ship.group)
  const storm = new THREE.PointLight("#b990ff", 0, 110, 1.5)
  storm.position.set(8, 24, -18)
  scene.add(storm)
  let phase: ReleasePhase | undefined
  let amount = 0

  return {
    set(next: ReleasePhase | undefined) {
      phase = next
      if (next === "failed") {
        storm.color.set("#ff385b")
        ship.beamMaterial.color.set("#ff4d69")
      } else if (next === "succeeded") {
        storm.color.set("#6fffc1")
        ship.beamMaterial.color.set("#85ffd0")
      } else {
        storm.color.set("#b990ff")
        ship.beamMaterial.color.set("#9ef7ef")
      }
    },
    tick(t: number, dt: number) {
      const target = phase ? STRENGTH[phase] : 0
      amount += (target - amount) * Math.min(1, dt * (target ? 0.7 : 1.4))
      ship.group.visible = amount > 0.01
      if (!ship.group.visible) {
        storm.intensity = 0
        return
      }
      const scale = 2.15 + amount * 1.05
      ship.group.scale.setScalar(scale)
      ship.group.position.y = 43 - amount * 15 + Math.sin(t * 0.42) * 0.5
      ship.group.position.x = 12 + Math.sin(t * 0.18) * 3
      const beam = Math.max(0, (amount - 0.34) / 0.66)
      stepUfo(ship, t * 0.72, ship.group.position.y / scale - 0.7, beam)
      const charge = Math.max(0, Math.sin(t * 1.7) + Math.sin(t * 5.1) - 1.42)
      const lightning = charge * charge * 24
      const pulse = 1 + Math.sin(t * 3.2) * 0.12
      storm.intensity = amount * (phase === "deploying" || phase === "verifying" || phase === "failed" ? 8 * pulse + lightning : 3)
    },
  }
}
