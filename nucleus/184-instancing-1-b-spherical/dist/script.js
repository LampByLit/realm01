import * as THREE from 'three/webgpu'
import { TSL as $ } from 'three/webgpu'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import * as $$ from 'YCW_tsl_x'

const renderer = await new THREE.WebGPURenderer().init()
const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(35, 2, 0.1, 100)
const controls = new OrbitControls(camera, renderer.domElement)

camera.position.set(2, 1, 1)

const radius_segments = 10
const azimuth_segments = 32
const inclination_segments = 16
const cells_count = azimuth_segments * inclination_segments * radius_segments
const geom = new THREE.BoxGeometry(0.1, 0.1, 0.1)
const mat = new THREE.MeshBasicNodeMaterial()
scene.add(new THREE.InstancedMesh(geom, mat, cells_count))

const ii = $.instanceIndex.toFloat()
const radius = ii.div(azimuth_segments * inclination_segments).floor().div(radius_segments).remap(0, 1, 0.3, 0.5)
const azimuth = ii.mod(azimuth_segments * inclination_segments).mod(azimuth_segments)
const azimuth01 = $$.mirrored_repeat(azimuth.div(azimuth_segments).mul(2)) // sym
const inclination = ii.mod(azimuth_segments * inclination_segments).div(azimuth_segments).floor()
const inclination01 = inclination.div(inclination_segments).remap(0, 1, 1 / inclination_segments, 1 - 1 / inclination_segments) // opened
const spherical3d01 = $.vec3(radius, azimuth01, inclination01)
const cartesian3d = $$.spherical3d01_to_cartesian3d(spherical3d01, $.vec3(0, 0, 0))
const cell_scale = $.mx_noise_float(cartesian3d.add($.time)).remap(-1, 1, 0, 1).smoothstep(0.4, 0.8)

mat.positionNode = $.positionLocal.mul(cell_scale).add(cartesian3d)
mat.colorNode = $.mix($.color('black'), $.color('cyan'), $.smoothstep(0.4, 0.7, cell_scale))

renderer.setAnimationLoop(() => renderer.render(scene, camera))

addEventListener('resize', () => {
  renderer.setPixelRatio(devicePixelRatio)
  renderer.setSize(innerWidth, innerHeight, false)
  camera.aspect = innerWidth / innerHeight
  camera.updateProjectionMatrix()
})
dispatchEvent(new Event('resize'))
document.body.prepend(renderer.domElement)
controls.update()