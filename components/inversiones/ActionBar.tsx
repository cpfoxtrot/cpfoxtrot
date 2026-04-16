"use client";

import { useState, useRef, useEffect } from "react";
import type { PosicionRow } from "@/lib/data/portfolio";
import AddPosition from "./modals/AddPosition";
import EditPosition from "./modals/EditPosition";
import ClosePosition from "./modals/ClosePosition";
import DeletePosition from "./modals/DeletePosition";
import UpdatePrice from "./modals/UpdatePrice";
import AddDividend from "./modals/AddDividend";

type ModalType = "add" | "edit" | "close" | "delete" | "price" | "dividend" | null;

const ITEMS: { id: ModalType; label: string }[] = [
  { id: "add",      label: "+ Añadir posición" },
  { id: "edit",     label: "Editar posición" },
  { id: "close",    label: "Cerrar posición" },
  { id: "delete",   label: "Eliminar posición" },
  { id: "price",    label: "Actualizar cotización" },
  { id: "dividend", label: "Añadir dividendo" },
];

interface Props {
  posiciones: PosicionRow[];
  openTickers: string[];
}

export default function ActionBar({ posiciones, openTickers }: Props) {
  const [open, setOpen] = useState(false);
  const [modal, setModal] = useState<ModalType>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [open]);

  const closeModal = () => setModal(null);
  const pick = (id: ModalType) => { setModal(id); setOpen(false); };

  return (
    <>
      <div className="actions-menu" ref={menuRef}>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => setOpen((v) => !v)}
        >
          Acciones ▾
        </button>
        {open && (
          <div className="actions-dropdown">
            {ITEMS.map((item) => (
              <button
                key={item.id}
                className="actions-dropdown-item"
                onClick={() => pick(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {modal === "add"      && <AddPosition onClose={closeModal} />}
      {modal === "edit"     && <EditPosition posiciones={posiciones} onClose={closeModal} />}
      {modal === "close"    && <ClosePosition posiciones={posiciones} onClose={closeModal} />}
      {modal === "delete"   && <DeletePosition posiciones={posiciones} onClose={closeModal} />}
      {modal === "price"    && <UpdatePrice openTickers={openTickers} onClose={closeModal} />}
      {modal === "dividend" && <AddDividend openTickers={openTickers} onClose={closeModal} />}
    </>
  );
}
