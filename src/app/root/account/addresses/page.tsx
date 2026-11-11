"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Drawer } from "@/components/ui/Drawer";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/hooks/useAuth";
import { useAddresses, type Address, type AddressInput } from "@/hooks/useAddresses";
import { MapPin, Plus, Home, Briefcase, MapPinned } from "lucide-react";

type DrawerMode = "create" | "edit";

const EMPTY_FORM: AddressInput = {
  label: "home",
  fullName: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  country: "Ethiopia",
  postalCode: "",
};

function AddressCard({
  address,
  onEdit,
  onDelete,
  onSetDefault,
}: {
  address: Address;
  onEdit: () => void;
  onDelete: () => void;
  onSetDefault: () => void;
}) {
  return (
    <div className="rounded-xl bg-[rgba(255,255,255,0.60)] backdrop-blur-lg border border-[rgba(15,23,42,0.10)] shadow-md p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-black uppercase tracking-tight">{address.fullName}</p>
            {address.isDefault ? <Badge variant="secondary">default</Badge> : null}
            <Badge variant="outline">{address.label}</Badge>
          </div>
          <p className="mt-1 text-xs font-bold text-text-secondary uppercase">{address.phone}</p>
          <div className="mt-3 text-xs font-bold text-text-secondary uppercase space-y-1">
            <div>
              {address.addressLine1}
              {address.addressLine2 ? `, ${address.addressLine2}` : ""}
            </div>
            <div>
              {address.city}, {address.country}
              {address.postalCode ? ` ${address.postalCode}` : ""}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <Button variant="outline" size="sm" onClick={onEdit}>
            Edit
          </Button>
          <Button variant="outline" size="sm" onClick={onDelete} className="text-red-600 border-red-200 hover:bg-red-50">
            Delete
          </Button>
          {!address.isDefault ? (
            <Button variant="secondary" size="sm" onClick={onSetDefault}>
              Set Default
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function AccountAddressesPage() {
  const { user, isHydrated, isAuthenticated } = useAuth();
  const { addresses, createAddress, updateAddress, deleteAddress, setDefault } = useAddresses(user?.id);

  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<DrawerMode>("create");
  const [editing, setEditing] = useState<Address | null>(null);
  const [form, setForm] = useState<AddressInput>(EMPTY_FORM);

  const title = mode === "create" ? "Add Address" : "Edit Address";

  const canSave = useMemo(() => {
    return (
      form.fullName.trim().length > 1 &&
      form.phone.trim().length > 5 &&
      form.addressLine1.trim().length > 4 &&
      form.city.trim().length > 1 &&
      form.country.trim().length > 1
    );
  }, [form]);

  if (!isHydrated) return null;
  if (!isAuthenticated || !user) return null;

  const openCreate = () => {
    setMode("create");
    setEditing(null);
    setForm(EMPTY_FORM);
    setIsOpen(true);
  };

  const openEdit = (addr: Address) => {
    setMode("edit");
    setEditing(addr);
    setForm({
      label: addr.label,
      fullName: addr.fullName,
      phone: addr.phone,
      addressLine1: addr.addressLine1,
      addressLine2: addr.addressLine2 ?? "",
      city: addr.city,
      country: addr.country,
      postalCode: addr.postalCode ?? "",
    });
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
  };

  const save = () => {
    if (!canSave) return;
    if (mode === "create") {
      createAddress({
        ...form,
        addressLine2: form.addressLine2?.trim() ? form.addressLine2 : undefined,
        postalCode: form.postalCode?.trim() ? form.postalCode : undefined,
      });
      close();
      return;
    }
    if (!editing) return;
    updateAddress(editing.id, {
      ...form,
      addressLine2: form.addressLine2?.trim() ? form.addressLine2 : undefined,
      postalCode: form.postalCode?.trim() ? form.postalCode : undefined,
    });
    close();
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 border border-[rgba(66,157,254,0.2)] bg-gradient-to-br from-[rgba(66,157,254,0.06)] to-[rgba(255,255,255,0.70)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[rgba(66,157,254,0.12)] flex items-center justify-center">
              <MapPin className="w-5 h-5 text-[#429DFE]" />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight">Addresses</h2>
              <p className="text-sm text-text-secondary mt-0.5">Manage shipping addresses for faster checkout</p>
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={openCreate}><Plus className="w-4 h-4 mr-1" />Add Address</Button>
        </div>
      </Card>

      {addresses.length === 0 ? (
        <Card className="p-6">
          <div className="py-8 text-center">
            <MapPin className="w-12 h-12 text-text-secondary/30 mx-auto mb-3" />
            <p className="text-sm font-bold text-text-secondary">No addresses saved</p>
            <p className="text-xs text-text-secondary mt-1">Add a shipping address for faster checkout</p>
            <Button variant="secondary" size="sm" className="mt-4" onClick={openCreate}>
              <Plus className="w-4 h-4 mr-1" />Add your first address
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="p-6">
          <div className="space-y-4">
            {addresses.map((a) => (
              <AddressCard
                key={a.id}
                address={a}
                onEdit={() => openEdit(a)}
                onDelete={() => deleteAddress(a.id)}
                onSetDefault={() => setDefault(a.id)}
              />
            ))}
          </div>
        </Card>
      )}

      <Drawer isOpen={isOpen} onClose={close} title={title}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Label"
              value={form.label}
              onChange={(e) => {
                const next = e.target.value;
                if (next === "home" || next === "work" || next === "other") {
                  setForm((p) => ({ ...p, label: next }));
                }
              }}
              placeholder="home | work | other"
            />
            <Input
              label="Full name"
              value={form.fullName}
              onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
              placeholder="Full name"
            />
          </div>

          <Input
            label="Phone"
            value={form.phone}
            onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
            placeholder="Phone number"
          />

          <Input
            label="Address line 1"
            value={form.addressLine1}
            onChange={(e) => setForm((p) => ({ ...p, addressLine1: e.target.value }))}
            placeholder="Street, building, etc."
          />

          <Input
            label="Address line 2 (optional)"
            value={form.addressLine2}
            onChange={(e) => setForm((p) => ({ ...p, addressLine2: e.target.value }))}
            placeholder="Apartment, suite, floor"
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Input
              label="City"
              value={form.city}
              onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
              placeholder="City"
            />
            <Input
              label="Country"
              value={form.country}
              onChange={(e) => setForm((p) => ({ ...p, country: e.target.value }))}
              placeholder="Country"
            />
            <Input
              label="Postal code (optional)"
              value={form.postalCode}
              onChange={(e) => setForm((p) => ({ ...p, postalCode: e.target.value }))}
              placeholder="Postal code"
            />
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <Button variant="secondary" onClick={save} disabled={!canSave}>
              Save
            </Button>
            <Button variant="outline" onClick={close}>
              Cancel
            </Button>
          </div>
        </div>
      </Drawer>
    </div>
  );
}
