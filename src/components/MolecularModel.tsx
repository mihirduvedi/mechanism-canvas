import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import {
  buildMolecularGeometry,
  type MolecularAtom3D,
  type MolecularGeometry3D,
} from "../domain/molecular-geometry";
import type { ElementSymbol, MoleculeState } from "../domain/types";

interface MolecularModelProps {
  molecule: MoleculeState;
}

const ELEMENT_NAMES: Record<ElementSymbol, string> = {
  H: "Hydrogen",
  C: "Carbon",
  N: "Nitrogen",
  O: "Oxygen",
  Cl: "Chlorine",
  Br: "Bromine",
  I: "Iodine",
};

const ELEMENT_COLORS: Record<ElementSymbol, number> = {
  H: 0xf4f2eb,
  C: 0x303635,
  N: 0x426fa8,
  O: 0xc75648,
  Cl: 0x56a263,
  Br: 0x8a493a,
  I: 0x74558e,
};

function toVector3(value: { x: number; y: number; z: number }): THREE.Vector3 {
  return new THREE.Vector3(value.x, value.y, value.z);
}

function readableCharge(charge: number): string {
  if (charge === 0) return "neutral";
  return charge > 0 ? `formal charge +${charge}` : `formal charge ${charge}`;
}

function createCylinder(
  start: THREE.Vector3,
  end: THREE.Vector3,
  radius: number,
  material: THREE.Material,
  radialSegments = 20,
): THREE.Mesh {
  const midpoint = start.clone().add(end).multiplyScalar(0.5);
  const direction = end.clone().sub(start);
  const cylinder = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, direction.length(), radialSegments),
    material,
  );
  cylinder.position.copy(midpoint);
  cylinder.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  return cylinder;
}

function perpendicularTo(direction: THREE.Vector3): THREE.Vector3 {
  const helper = Math.abs(direction.y) < 0.82 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
  return new THREE.Vector3().crossVectors(direction, helper).normalize();
}

function addBondMeshes(
  group: THREE.Group,
  model: MolecularGeometry3D,
  atomById: Map<string, MolecularAtom3D>,
): void {
  const bondMaterial = new THREE.MeshStandardMaterial({
    color: 0x858c8b,
    metalness: 0.08,
    roughness: 0.38,
  });
  for (const bond of model.bonds) {
    const first = atomById.get(bond.atomIds[0]);
    const second = atomById.get(bond.atomIds[1]);
    if (!first || !second) continue;
    const start = toVector3(first.position);
    const end = toVector3(second.position);
    const direction = end.clone().sub(start).normalize();
    const perpendicular = perpendicularTo(direction);
    const offsets = bond.order === 1 ? [0] : bond.order === 2 ? [-0.105, 0.105] : [-0.16, 0, 0.16];
    for (const offset of offsets) {
      const displacement = perpendicular.clone().multiplyScalar(offset);
      const cylinder = createCylinder(
        start.clone().add(displacement),
        end.clone().add(displacement),
        bond.order === 1 ? 0.105 : 0.074,
        bondMaterial,
      );
      cylinder.castShadow = true;
      cylinder.receiveShadow = true;
      cylinder.userData.bondId = bond.id;
      group.add(cylinder);
    }
  }
}

function addPolarityMeshes(
  group: THREE.Group,
  model: MolecularGeometry3D,
  atomById: Map<string, MolecularAtom3D>,
): void {
  const material = new THREE.MeshStandardMaterial({
    color: 0x28a4b3,
    emissive: 0x0b4d55,
    emissiveIntensity: 0.18,
    roughness: 0.35,
  });
  for (const bond of model.bonds) {
    if (!bond.negativeEndAtomId || bond.electronegativityDelta < 0.35) continue;
    const negative = atomById.get(bond.negativeEndAtomId);
    const positiveId = bond.atomIds.find((id) => id !== bond.negativeEndAtomId);
    const positive = positiveId ? atomById.get(positiveId) : undefined;
    if (!negative || !positive) continue;
    const from = toVector3(positive.position);
    const to = toVector3(negative.position);
    const direction = to.clone().sub(from).normalize();
    const perpendicular = perpendicularTo(direction).multiplyScalar(0.22);
    const arrowStart = from.clone().lerp(to, 0.28).add(perpendicular);
    const arrowEnd = from.clone().lerp(to, 0.73).add(perpendicular);
    const shaftEnd = arrowEnd.clone().addScaledVector(direction, -0.12);
    const shaft = createCylinder(arrowStart, shaftEnd, 0.025, material, 12);
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.085, 0.18, 18), material);
    cone.position.copy(arrowEnd);
    cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
    group.add(shaft, cone);
  }
}

function addLonePairMeshes(group: THREE.Group, model: MolecularGeometry3D): void {
  const material = new THREE.MeshPhysicalMaterial({
    color: 0x62d5df,
    emissive: 0x0b5961,
    emissiveIntensity: 0.2,
    transparent: true,
    opacity: 0.84,
    roughness: 0.25,
    clearcoat: 0.35,
    depthWrite: false,
  });
  const geometry = new THREE.SphereGeometry(0.13, 24, 18);
  for (const pair of model.lonePairs) {
    const direction = toVector3(pair.direction).normalize();
    const perpendicular = perpendicularTo(direction).multiplyScalar(0.11);
    for (const side of [-1, 1]) {
      const lobe = new THREE.Mesh(geometry, material);
      lobe.position.copy(toVector3(pair.position).addScaledVector(perpendicular, side));
      lobe.scale.set(0.82, 1.52, 0.82);
      lobe.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
      lobe.userData.lonePairId = pair.id;
      group.add(lobe);
    }
  }
}

function disposeScene(scene: THREE.Scene): void {
  scene.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      object.geometry.dispose();
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach((material) => material.dispose());
    }
  });
}

export function MolecularModel({ molecule }: MolecularModelProps) {
  const model = useMemo(() => buildMolecularGeometry(molecule), [molecule]);
  const explicitAtoms = useMemo(() => model.atoms.filter((atom) => !atom.virtual), [model]);
  const [selectedAtomId, setSelectedAtomId] = useState(explicitAtoms[0]?.id ?? "");
  const [showLonePairs, setShowLonePairs] = useState(true);
  const [showPolarity, setShowPolarity] = useState(true);
  const [autoRotate, setAutoRotate] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const atomMeshesRef = useRef(new Map<string, THREE.Mesh>());
  const lonePairGroupRef = useRef<THREE.Group | null>(null);
  const polarityGroupRef = useRef<THREE.Group | null>(null);
  const selectedRef = useRef(selectedAtomId);

  useEffect(() => {
    setSelectedAtomId(explicitAtoms[0]?.id ?? "");
  }, [explicitAtoms]);

  useEffect(() => {
    selectedRef.current = selectedAtomId;
    atomMeshesRef.current.forEach((mesh, atomId) => {
      const material = mesh.material as THREE.MeshPhysicalMaterial;
      const selected = atomId === selectedAtomId;
      material.emissive.setHex(selected ? 0x0a7f8e : 0x000000);
      material.emissiveIntensity = selected ? 0.34 : 0;
      mesh.scale.setScalar(selected ? 1.09 : 1);
    });
  }, [selectedAtomId]);

  useEffect(() => {
    if (!controlsRef.current) return;
    controlsRef.current.autoRotate =
      autoRotate && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, [autoRotate]);

  useEffect(() => {
    if (lonePairGroupRef.current) lonePairGroupRef.current.visible = showLonePairs;
  }, [showLonePairs]);

  useEffect(() => {
    if (polarityGroupRef.current) polarityGroupRef.current.visible = showPolarity;
  }, [showPolarity]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const viewport = viewportRef.current;
    if (!canvas || !viewport) return;

    setRenderError(null);
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
      });
    } catch {
      setRenderError("Interactive 3D is unavailable in this browser. The atom inspector below still describes the model.");
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.06;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.setClearColor(0xe8eef0, 1);

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0xe8eef0, model.radius * 5, model.radius * 10);
    const camera = new THREE.PerspectiveCamera(34, 1, 0.05, 120);
    const center = toVector3(model.center);
    camera.position.copy(center).add(new THREE.Vector3(model.radius * 0.7, model.radius * 0.48, model.radius * 3.05));

    const controls = new OrbitControls(camera, canvas);
    controls.target.copy(center);
    controls.enableDamping = true;
    controls.dampingFactor = 0.075;
    controls.enablePan = false;
    controls.minDistance = Math.max(2.3, model.radius * 1.15);
    controls.maxDistance = model.radius * 6.4;
    controls.autoRotate = autoRotate && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    controls.autoRotateSpeed = 0.65;
    controls.saveState();
    controlsRef.current = controls;

    scene.add(new THREE.HemisphereLight(0xffffff, 0x7b898b, 1.75));
    const keyLight = new THREE.DirectionalLight(0xffffff, 3.2);
    keyLight.position.copy(center).add(new THREE.Vector3(-4, 7, 6));
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 35;
    const shadowExtent = Math.max(4, model.radius * 1.5);
    keyLight.shadow.camera.left = -shadowExtent;
    keyLight.shadow.camera.right = shadowExtent;
    keyLight.shadow.camera.top = shadowExtent;
    keyLight.shadow.camera.bottom = -shadowExtent;
    scene.add(keyLight);
    const rimLight = new THREE.DirectionalLight(0x74d9e2, 1.2);
    rimLight.position.copy(center).add(new THREE.Vector3(5, 2, -5));
    scene.add(rimLight);

    const modelGroup = new THREE.Group();
    scene.add(modelGroup);
    const atomById = new Map(model.atoms.map((atom) => [atom.id, atom]));
    addBondMeshes(modelGroup, model, atomById);
    const lonePairGroup = new THREE.Group();
    addLonePairMeshes(lonePairGroup, model);
    lonePairGroup.visible = showLonePairs;
    lonePairGroupRef.current = lonePairGroup;
    modelGroup.add(lonePairGroup);
    const polarityGroup = new THREE.Group();
    addPolarityMeshes(polarityGroup, model, atomById);
    polarityGroup.visible = showPolarity;
    polarityGroupRef.current = polarityGroup;
    modelGroup.add(polarityGroup);

    const atomMeshes = new Map<string, THREE.Mesh>();
    for (const atom of model.atoms) {
      const material = new THREE.MeshPhysicalMaterial({
        color: ELEMENT_COLORS[atom.element],
        metalness: 0.04,
        roughness: atom.element === "H" ? 0.28 : 0.34,
        clearcoat: 0.35,
        clearcoatRoughness: 0.28,
        emissive: atom.id === selectedRef.current ? 0x0a7f8e : 0x000000,
        emissiveIntensity: atom.id === selectedRef.current ? 0.34 : 0,
      });
      const atomMesh = new THREE.Mesh(new THREE.SphereGeometry(atom.displayRadius, 48, 32), material);
      atomMesh.position.copy(toVector3(atom.position));
      atomMesh.castShadow = true;
      atomMesh.receiveShadow = true;
      atomMesh.userData.atomId = atom.id;
      if (atom.id === selectedRef.current) atomMesh.scale.setScalar(1.09);
      atomMeshes.set(atom.id, atomMesh);
      modelGroup.add(atomMesh);

      if (atom.formalCharge !== 0) {
        const haloMaterial = new THREE.MeshBasicMaterial({
          color: atom.formalCharge < 0 ? 0xdc5c55 : 0x4f77c8,
          transparent: true,
          opacity: 0.17,
          side: THREE.BackSide,
          depthWrite: false,
        });
        const halo = new THREE.Mesh(new THREE.SphereGeometry(atom.displayRadius * 1.32, 32, 20), haloMaterial);
        halo.position.copy(atomMesh.position);
        halo.userData.chargeAtomId = atom.id;
        modelGroup.add(halo);
      }
    }
    atomMeshesRef.current = atomMeshes;

    const lowestY = model.atoms.reduce((lowest, atom) => Math.min(lowest, atom.position.y - atom.displayRadius), 0);
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(model.radius * 5, model.radius * 4),
      new THREE.ShadowMaterial({ color: 0x3c4a4b, opacity: 0.17 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(center.x, lowestY - 0.62, center.z);
    ground.receiveShadow = true;
    scene.add(ground);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let pointerDown = { x: 0, y: 0 };
    const handlePointerDown = (event: PointerEvent) => {
      pointerDown = { x: event.clientX, y: event.clientY };
    };
    const handlePointerUp = (event: PointerEvent) => {
      if (Math.hypot(event.clientX - pointerDown.x, event.clientY - pointerDown.y) > 6) return;
      const bounds = canvas.getBoundingClientRect();
      pointer.set(
        ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
        -((event.clientY - bounds.top) / bounds.height) * 2 + 1,
      );
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects([...atomMeshes.values()], false)[0];
      const atomId = hit?.object.userData.atomId as string | undefined;
      if (atomId) setSelectedAtomId(atomId);
    };
    canvas.addEventListener("pointerdown", handlePointerDown);
    canvas.addEventListener("pointerup", handlePointerUp);

    const resize = () => {
      const width = Math.max(1, viewport.clientWidth);
      const height = Math.max(1, viewport.clientHeight);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(viewport);
    resize();

    let previousFrameTime = performance.now();
    renderer.setAnimationLoop((frameTime) => {
      const deltaSeconds = Math.min((frameTime - previousFrameTime) / 1000, 0.1);
      previousFrameTime = frameTime;
      controls.update(deltaSeconds);
      renderer.render(scene, camera);
    });

    return () => {
      renderer.setAnimationLoop(null);
      resizeObserver.disconnect();
      canvas.removeEventListener("pointerdown", handlePointerDown);
      canvas.removeEventListener("pointerup", handlePointerUp);
      controls.dispose();
      controlsRef.current = null;
      atomMeshesRef.current.clear();
      lonePairGroupRef.current = null;
      polarityGroupRef.current = null;
      disposeScene(scene);
      renderer.dispose();
    };
  }, [model]);

  const selectedAtom = model.atoms.find((atom) => atom.id === selectedAtomId) ?? explicitAtoms[0];
  const selectedGeometry = selectedAtom
    ? model.atomGeometry.find((entry) => entry.atomId === selectedAtom.sourceAtomId)
    : undefined;

  const rotateView = (horizontal: number, vertical: number) => {
    controlsRef.current?.rotateLeft(horizontal);
    controlsRef.current?.rotateUp(vertical);
    controlsRef.current?.update();
  };

  const reducedMotion =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <section className="physical-model" aria-labelledby="physical-model-heading">
      <div className="physical-model__heading">
        <div>
          <p className="section-kicker">Interactive molecular geometry</p>
          <h3 id="physical-model-heading">Three-dimensional electron domains</h3>
        </div>
        <span>VSEPR-informed · 3D</span>
      </div>
      <p className="physical-model__boundary">
        Rotate and zoom the molecule to inspect its geometry. Bond length and order, electron-domain count, lone pairs, formal charge, and bond polarity all change what is drawn. This is an explanatory model, not a quantum calculation or a predicted conformer.
      </p>

      <div className="model-layout">
        <div className="model-stage">
          <div className="model-viewport" ref={viewportRef}>
            <canvas
              ref={canvasRef}
              className="molecular-canvas"
              role="img"
              aria-label={`Interactive three-dimensional model of ${molecule.label}. Use the adjacent atom selector and view controls for a non-pointer interface.`}
            />
            {renderError && <p className="model-error" role="status">{renderError}</p>}
            <div className="model-stage__hint" aria-hidden="true">Drag to orbit · scroll to zoom · select an atom</div>
          </div>

          <div className="model-toolbar" aria-label="Three-dimensional model controls">
            <button type="button" onClick={() => controlsRef.current?.reset()}>Reset view</button>
            <button
              type="button"
              aria-pressed={autoRotate}
              disabled={reducedMotion}
              title={reducedMotion ? "Auto-rotation is disabled by your reduced-motion setting." : undefined}
              onClick={() => setAutoRotate((current) => !current)}
            >
              {autoRotate ? "Pause rotation" : "Auto-rotate"}
            </button>
            <button type="button" aria-pressed={showLonePairs} onClick={() => setShowLonePairs((current) => !current)}>
              Lone pairs
            </button>
            <button type="button" aria-pressed={showPolarity} onClick={() => setShowPolarity((current) => !current)}>
              Polarity
            </button>
          </div>
        </div>

        <aside className="atom-inspector" aria-labelledby="atom-inspector-heading">
          <p className="section-kicker" id="atom-inspector-heading">Atom inspector</p>
          <label htmlFor="model-atom-select">Selected atom</label>
          <select
            id="model-atom-select"
            value={selectedAtomId}
            onChange={(event) => setSelectedAtomId(event.target.value)}
          >
            {model.atoms.map((atom) => (
              <option value={atom.id} key={atom.id}>
                {atom.virtual ? "Implicit " : ""}{ELEMENT_NAMES[atom.element]} · {atom.label}
              </option>
            ))}
          </select>

          {selectedAtom && (
            <div className="atom-card" aria-live="polite">
              <div className="atom-card__identity">
                <span className={`element-swatch element-swatch--${selectedAtom.element.toLowerCase()}`} aria-hidden="true" />
                <div>
                  <strong>{ELEMENT_NAMES[selectedAtom.element]}</strong>
                  <span>{selectedAtom.virtual ? "implicit atom" : selectedAtom.label}</span>
                </div>
                <b>{selectedAtom.formalCharge === 0 ? "0" : selectedAtom.formalCharge > 0 ? `+${selectedAtom.formalCharge}` : selectedAtom.formalCharge}</b>
              </div>
              <dl>
                <div><dt>Electronegativity</dt><dd>{selectedAtom.electronegativity.toFixed(2)}</dd></div>
                <div><dt>Formal charge</dt><dd>{readableCharge(selectedAtom.formalCharge)}</dd></div>
                <div><dt>Electron geometry</dt><dd>{selectedGeometry?.electronGeometry ?? "single domain"}</dd></div>
                <div><dt>Molecular geometry</dt><dd>{selectedGeometry?.molecularGeometry ?? "terminal atom"}</dd></div>
                <div><dt>Lone pairs</dt><dd>{selectedAtom.lonePairCount}</dd></div>
                <div><dt>Bond-order sum</dt><dd>{selectedGeometry?.bondOrderSum ?? 1}</dd></div>
                <div><dt>Mean shown angle</dt><dd>{selectedGeometry?.meanBondAngle ? `${selectedGeometry.meanBondAngle.toFixed(1)}°` : "not applicable"}</dd></div>
                <div><dt>Strongest ΔEN</dt><dd>{selectedGeometry?.strongestPolarity.toFixed(2) ?? "0.00"}</dd></div>
              </dl>
            </div>
          )}

          <div className="view-nudges" aria-label="Keyboard view rotation">
            <button type="button" aria-label="Rotate view left" onClick={() => rotateView(0.24, 0)}>←</button>
            <button type="button" aria-label="Rotate view up" onClick={() => rotateView(0, 0.18)}>↑</button>
            <button type="button" aria-label="Rotate view down" onClick={() => rotateView(0, -0.18)}>↓</button>
            <button type="button" aria-label="Rotate view right" onClick={() => rotateView(-0.24, 0)}>→</button>
          </div>
        </aside>
      </div>

      <ul className="force-key" aria-label="Three-dimensional model legend">
        <li><span className="force-key__bond" aria-hidden="true" />Parallel rods show bond order</li>
        <li><span className="force-key__pair" aria-hidden="true" />Cyan lobes show lone pairs</li>
        <li><span className="force-key__polarity" aria-hidden="true">→</span>Arrow points toward δ−</li>
        <li><span className="force-key__charge" aria-hidden="true">±</span>Halo shows formal charge</li>
      </ul>
    </section>
  );
}
