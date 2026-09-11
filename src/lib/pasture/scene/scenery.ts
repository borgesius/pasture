import * as THREE from "three"
import { mulberry32 } from "@/lib/rng"
import { PENS, type PenID } from "../pens"
import { groundTexture, paintSign, type Sign } from "./atlas"

const TAU = Math.PI * 2

export const POND = { x: -30, z: -19, rx: 6, rz: 4 }

export function inPond(x: number, z: number, margin = 1.5) {
  const dx = (x - POND.x) / (POND.rx + margin)
  const dz = (z - POND.z) / (POND.rz + margin)
  return dx * dx + dz * dz < 1
}

export type Scenery = {
  signs: Map<PenID, Sign>
  clouds: THREE.Group[]
  /** Advance the wind. */
  tick(t: number): void
}

function buildGround(scene: THREE.Scene) {
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(360, 360), new THREE.MeshStandardMaterial({ map: groundTexture(), roughness: 1, metalness: 0 }))
  ground.rotation.x = -Math.PI / 2
  ground.receiveShadow = true
  scene.add(ground)
}

/** A blade: a thin strip that narrows and leans as it rises, lit like the ground so it never goes black. */
function bladeGeometry() {
  const rows = 4
  const height = 0.55
  const width = 0.07
  // Close to the ground colour at the root so distant blades read as texture, not specks.
  const base = new THREE.Color("#5aa848")
  const tip = new THREE.Color("#b6ec98")
  const positions: number[] = []
  const colors: number[] = []
  const normals: number[] = []
  const uvs: number[] = []
  const index: number[] = []
  for (let r = 0; r <= rows; r++) {
    const t = r / rows
    const half = (width * (1 - t)) / 2 + 0.003
    const bend = t * t * 0.14
    const color = base.clone().lerp(tip, t)
    for (const x of [-half, half]) {
      positions.push(x, t * height, bend)
      colors.push(color.r, color.g, color.b)
      normals.push(0, 1, 0)
      uvs.push(x > 0 ? 1 : 0, t)
    }
  }
  for (let r = 0; r < rows; r++) {
    const a = r * 2
    index.push(a, a + 1, a + 2, a + 1, a + 3, a + 2)
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3))
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3))
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2))
  geometry.setIndex(index)
  return geometry
}

function buildGrass(scene: THREE.Scene, uniforms: { uTime: { value: number } }) {
  const material = new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 1 })
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = uniforms.uTime
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nuniform float uTime;")
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
        float bladeT = position.y / 0.55;
        float sway = sin(uTime * 1.6 + instanceMatrix[3][0] * 0.35 + instanceMatrix[3][2] * 0.27) * 0.6 + sin(uTime * 2.9 + instanceMatrix[3][2] * 0.7 + instanceMatrix[3][0] * 0.11) * 0.3;
        transformed.x += sway * 0.13 * bladeT * bladeT;`,
      )
  }
  const count = 9000
  const mesh = new THREE.InstancedMesh(bladeGeometry(), material, count)
  const rand = mulberry32(11)
  const matrix = new THREE.Matrix4()
  const position = new THREE.Vector3()
  const rotation = new THREE.Quaternion()
  const scale = new THREE.Vector3()
  const up = new THREE.Vector3(0, 1, 0)
  let placed = 0
  while (placed < count) {
    const x = (rand() - 0.5) * 124
    const z = (rand() - 0.5) * 86
    if (inPond(x, z, 0.5)) continue
    position.set(x, 0, z)
    rotation.setFromAxisAngle(up, rand() * TAU)
    const s = 0.7 + rand() * 0.9
    scale.set(s, s * (0.8 + rand() * 0.6), s)
    matrix.compose(position, rotation, scale)
    mesh.setMatrixAt(placed, matrix)
    placed++
  }
  mesh.receiveShadow = true
  mesh.frustumCulled = false
  scene.add(mesh)
}

function buildFlowers(scene: THREE.Scene) {
  const geometry = new THREE.SphereGeometry(0.085, 7, 6)
  const material = new THREE.MeshStandardMaterial({ roughness: 0.8 })
  const count = 700
  const mesh = new THREE.InstancedMesh(geometry, material, count)
  const rand = mulberry32(23)
  const palette = ["#ff7eb6", "#ffd166", "#ffffff", "#c58cff", "#ff9f66", "#fff4a8"].map((c) => new THREE.Color(c))
  const matrix = new THREE.Matrix4()
  let placed = 0
  while (placed < count) {
    // Flowers grow in little clumps.
    const cx = (rand() - 0.5) * 120
    const cz = (rand() - 0.5) * 82
    const color = palette[Math.floor(rand() * palette.length)]
    const clump = 2 + Math.floor(rand() * 5)
    for (let i = 0; i < clump && placed < count; i++) {
      const x = cx + (rand() - 0.5) * 2.4
      const z = cz + (rand() - 0.5) * 2.4
      if (inPond(x, z, 0.5)) continue
      matrix.makeTranslation(x, 0.2 + rand() * 0.15, z)
      mesh.setMatrixAt(placed, matrix)
      mesh.setColorAt(placed, color)
      placed++
    }
  }
  scene.add(mesh)
}

function buildPond(scene: THREE.Scene) {
  const rim = new THREE.Mesh(new THREE.CircleGeometry(1, 48), new THREE.MeshStandardMaterial({ color: "#d3c19a", roughness: 1 }))
  rim.rotation.x = -Math.PI / 2
  rim.position.set(POND.x, 0.015, POND.z)
  rim.scale.set(POND.rx + 1, POND.rz + 1, 1)
  scene.add(rim)
  const water = new THREE.Mesh(
    new THREE.CircleGeometry(1, 48),
    new THREE.MeshPhysicalMaterial({ color: "#3f9fda", roughness: 0.08, metalness: 0.05, clearcoat: 1, clearcoatRoughness: 0.1 }),
  )
  water.rotation.x = -Math.PI / 2
  water.position.set(POND.x, 0.03, POND.z)
  water.scale.set(POND.rx, POND.rz, 1)
  scene.add(water)
  const pad = new THREE.MeshStandardMaterial({ color: "#3f9a3a", roughness: 0.9 })
  const rand = mulberry32(61)
  for (let i = 0; i < 5; i++) {
    const lily = new THREE.Mesh(new THREE.CircleGeometry(0.42 + rand() * 0.25, 18, 0.3, TAU - 0.6), pad)
    lily.rotation.x = -Math.PI / 2
    lily.rotation.z = rand() * TAU
    const angle = rand() * TAU
    const r = 0.35 + rand() * 0.45
    lily.position.set(POND.x + Math.cos(angle) * POND.rx * r, 0.045, POND.z + Math.sin(angle) * POND.rz * r)
    scene.add(lily)
  }
}

function buildTrees(scene: THREE.Scene) {
  const trunk = new THREE.MeshStandardMaterial({ color: "#6f4a2c", roughness: 1 })
  const leaves = ["#3e8f3a", "#4ca046", "#2f7a2e", "#5aae4f"].map((c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.9 }))
  const rand = mulberry32(31)
  // Behind and beside the pens only: the signs stand along the front edge
  // and the camera looks in from the front, so nothing may grow there.
  const spots: Array<[number, number]> = [
    [-57, -28], [-56, 0], [-57, 18], [56, -24], [57, 6], [56, 20], [-40, -44], [-18, -46], [0, -44], [48, -42], [-52, -40], [60, -36], [34, -46],
  ]
  for (const [x, z] of spots) {
    const tree = new THREE.Group()
    const height = 2.6 + rand() * 1.8
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.42, height, 9), trunk)
    stem.position.y = height / 2
    stem.castShadow = true
    tree.add(stem)
    const puffs = 4 + Math.floor(rand() * 3)
    for (let i = 0; i < puffs; i++) {
      const r = 1.5 + rand() * 1.5
      const puff = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 2), leaves[Math.floor(rand() * leaves.length)])
      const angle = rand() * TAU
      const spread = i === 0 ? 0 : 0.9 + rand() * 1.2
      puff.position.set(Math.cos(angle) * spread, height + r * 0.55 + (i === 0 ? 0.8 : rand() * 1.2), Math.sin(angle) * spread)
      puff.castShadow = true
      tree.add(puff)
    }
    tree.position.set(x, 0, z)
    tree.rotation.y = rand() * TAU
    scene.add(tree)
  }
}

function buildRocks(scene: THREE.Scene) {
  const material = new THREE.MeshStandardMaterial({ color: "#9a9a92", roughness: 1 })
  const rand = mulberry32(41)
  const spots: Array<[number, number]> = [[-12, -8], [30, -26], [8, -28], [-40, -4], [40, -12], [-2, -16], [20, -6]]
  for (const [x, z] of spots) {
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.5 + rand() * 0.7, 1), material)
    rock.position.set(x, 0.2, z)
    rock.scale.set(1 + rand() * 0.6, 0.6 + rand() * 0.4, 1 + rand() * 0.6)
    rock.rotation.set(rand(), rand(), rand())
    rock.castShadow = true
    rock.receiveShadow = true
    scene.add(rock)
  }
}

function buildFences(scene: THREE.Scene) {
  const wood = new THREE.MeshStandardMaterial({ color: "#9c6f3a", roughness: 0.95 })
  const spacing = 3
  const posts: THREE.Matrix4[] = []
  const rails: THREE.Matrix4[] = []
  const up = new THREE.Vector3(0, 1, 0)
  for (const pen of PENS) {
    const { x0, x1, z0, z1 } = pen.rect
    const sides: Array<{ from: [number, number]; to: [number, number] }> = [
      { from: [x0, z0], to: [x1, z0] },
      { from: [x0, z1], to: [x1, z1] },
      { from: [x0, z0], to: [x0, z1] },
      { from: [x1, z0], to: [x1, z1] },
    ]
    for (const side of sides) {
      const dx = side.to[0] - side.from[0]
      const dz = side.to[1] - side.from[1]
      const length = Math.hypot(dx, dz)
      const segments = Math.max(1, Math.round(length / spacing))
      const step = length / segments
      const angle = Math.atan2(dz, dx)
      const q = new THREE.Quaternion().setFromAxisAngle(up, -angle)
      for (let i = 0; i <= segments; i++) {
        const t = i / segments
        posts.push(new THREE.Matrix4().makeTranslation(side.from[0] + dx * t, 0.57, side.from[1] + dz * t))
        if (i === segments) continue
        const mx = side.from[0] + dx * (t + 0.5 / segments)
        const mz = side.from[1] + dz * (t + 0.5 / segments)
        for (const y of [0.45, 0.85]) {
          rails.push(new THREE.Matrix4().compose(new THREE.Vector3(mx, y, mz), q, new THREE.Vector3(step / spacing, 1, 1)))
        }
      }
    }
  }
  const postMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(0.2, 1.15, 0.2), wood, posts.length)
  posts.forEach((m, i) => postMesh.setMatrixAt(i, m))
  const railMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(spacing, 0.09, 0.07), wood, rails.length)
  rails.forEach((m, i) => railMesh.setMatrixAt(i, m))
  postMesh.castShadow = true
  railMesh.castShadow = true
  scene.add(postMesh, railMesh)
}

function buildSigns(scene: THREE.Scene) {
  const signs = new Map<PenID, Sign>()
  const wood = new THREE.MeshStandardMaterial({ color: "#8a6238", roughness: 1 })
  for (const pen of PENS) {
    const canvas = document.createElement("canvas")
    canvas.width = 512
    canvas.height = 176
    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    const sign: Sign = { canvas, texture, name: pen.name, count: 0 }
    paintSign(sign)
    const group = new THREE.Group()
    const board = new THREE.Mesh(new THREE.BoxGeometry(6.4, 2.2, 0.18), [wood, wood, wood, wood, new THREE.MeshStandardMaterial({ map: texture, roughness: 0.9 }), wood])
    board.position.y = 2.6
    board.castShadow = true
    group.add(board)
    for (const dx of [-2.6, 2.6]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.22, 2.4, 0.22), wood)
      post.position.set(dx, 1.2, -0.12)
      group.add(post)
    }
    group.position.set(pen.rect.x0 + 3.9, 0, pen.rect.z1 + 1.35)
    scene.add(group)
    signs.set(pen.id, sign)
  }
  return signs
}

function buildClouds(scene: THREE.Scene) {
  const material = new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 1, emissive: "#ffffff", emissiveIntensity: 0.3 })
  const rand = mulberry32(53)
  const clouds: THREE.Group[] = []
  for (let i = 0; i < 9; i++) {
    const cloud = new THREE.Group()
    const puffs = 4 + Math.floor(rand() * 4)
    for (let p = 0; p < puffs; p++) {
      const r = 1.8 + rand() * 2.2
      const puff = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), material)
      puff.position.set(p * 2.4 - puffs, rand() * 0.8, (rand() - 0.5) * 2.2)
      puff.scale.y = 0.72
      cloud.add(puff)
    }
    cloud.position.set((rand() - 0.5) * 200, 26 + rand() * 12, -40 - rand() * 80)
    cloud.userData.speed = 0.35 + rand() * 0.5
    scene.add(cloud)
    clouds.push(cloud)
  }
  return clouds
}

function buildSky(scene: THREE.Scene) {
  scene.background = new THREE.Color("#a9d8f5")
  scene.fog = new THREE.Fog("#bfe0f5", 130, 280)
  const sun = new THREE.Mesh(new THREE.SphereGeometry(7, 20, 20), new THREE.MeshBasicMaterial({ color: "#fff1a8" }))
  sun.position.set(90, 80, -120)
  scene.add(sun)
  scene.add(new THREE.HemisphereLight("#cfe9ff", "#4f8a3a", 0.95))
  const light = new THREE.DirectionalLight("#fff4dc", 2.2)
  light.position.set(40, 60, 30)
  light.castShadow = true
  light.shadow.mapSize.set(2048, 2048)
  light.shadow.camera.left = -75
  light.shadow.camera.right = 75
  light.shadow.camera.top = 75
  light.shadow.camera.bottom = -75
  light.shadow.camera.near = 5
  light.shadow.camera.far = 200
  light.shadow.bias = -0.0008
  light.shadow.normalBias = 0.02
  scene.add(light)
  scene.add(new THREE.AmbientLight("#ffffff", 0.22))
}

/** A red barn out back, with a hayloft window and a few bales beside it. */
function buildBarn(scene: THREE.Scene) {
  const red = new THREE.MeshStandardMaterial({ color: "#a83a2e", roughness: 0.9 })
  const trim = new THREE.MeshStandardMaterial({ color: "#f2ede4", roughness: 0.9 })
  const roofing = new THREE.MeshStandardMaterial({ color: "#4a3630", roughness: 0.95 })
  const dark = new THREE.MeshStandardMaterial({ color: "#3a2320", roughness: 1 })
  const barn = new THREE.Group()
  const width = 15
  const depth = 10
  const wall = 6
  const walls = new THREE.Mesh(new THREE.BoxGeometry(width, wall, depth), red)
  walls.position.y = wall / 2
  walls.castShadow = true
  walls.receiveShadow = true
  barn.add(walls)
  const gable = new THREE.Shape()
  gable.moveTo(-width / 2, wall)
  gable.lineTo(width / 2, wall)
  gable.lineTo(0, wall + 4.2)
  gable.closePath()
  const prism = new THREE.Mesh(new THREE.ExtrudeGeometry(gable, { depth, bevelEnabled: false }), red)
  prism.position.z = -depth / 2
  prism.castShadow = true
  barn.add(prism)
  const slope = Math.atan2(4.2, width / 2)
  const slopeLength = Math.hypot(4.2, width / 2) + 0.6
  for (const side of [-1, 1]) {
    const slab = new THREE.Mesh(new THREE.BoxGeometry(slopeLength, 0.28, depth + 1), roofing)
    slab.position.set((side * width) / 4, wall + 2.15, 0)
    slab.rotation.z = -side * slope
    slab.castShadow = true
    barn.add(slab)
  }
  const door = new THREE.Mesh(new THREE.BoxGeometry(4.6, 4.4, 0.2), dark)
  door.position.set(0, 2.2, depth / 2 + 0.05)
  barn.add(door)
  for (const angle of [Math.PI / 4, -Math.PI / 4]) {
    const brace = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.32, 0.12), trim)
    brace.position.set(0, 2.2, depth / 2 + 0.2)
    brace.rotation.z = angle
    barn.add(brace)
  }
  const frame = new THREE.Mesh(new THREE.BoxGeometry(5, 0.3, 0.14), trim)
  frame.position.set(0, 4.5, depth / 2 + 0.2)
  barn.add(frame)
  const loft = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.6, 0.2), trim)
  loft.position.set(0, wall + 1.6, depth / 2 + 0.05)
  barn.add(loft)
  const loftPane = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 0.22), dark)
  loftPane.position.set(0, wall + 1.6, depth / 2 + 0.06)
  barn.add(loftPane)
  for (const corner of [-1, 1]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.35, wall, 0.35), trim)
    post.position.set((corner * width) / 2, wall / 2, depth / 2)
    barn.add(post)
  }
  barn.position.set(20, 0, -48)
  barn.rotation.y = -0.12
  scene.add(barn)

  const straw = new THREE.MeshStandardMaterial({ color: "#d9b45e", roughness: 1 })
  const bale = new THREE.CylinderGeometry(1, 1, 1.7, 18)
  bale.rotateZ(Math.PI / 2)
  for (const [x, y, z, rot] of [
    [7, 1, -42, 0.2],
    [4.6, 1, -42.6, -0.3],
    [5.8, 2.7, -42.3, 0],
    [36, 1, -44, 1.2],
  ]) {
    const mesh = new THREE.Mesh(bale, straw)
    mesh.position.set(x, y, z)
    mesh.rotation.y = rot
    mesh.castShadow = true
    scene.add(mesh)
  }
}

export function buildScenery(scene: THREE.Scene): Scenery {
  const uniforms = { uTime: { value: 0 } }
  buildSky(scene)
  buildGround(scene)
  buildGrass(scene, uniforms)
  buildFlowers(scene)
  buildPond(scene)
  buildTrees(scene)
  buildRocks(scene)
  buildFences(scene)
  buildBarn(scene)
  const signs = buildSigns(scene)
  const clouds = buildClouds(scene)
  return {
    signs,
    clouds,
    tick(t) {
      uniforms.uTime.value = t
    },
  }
}
