import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useCreateClient } from '@/features/clients/hooks';
import { colors } from '@/lib/colors';
import { spacing } from '@/lib/theme';

export interface NewClientModalProps {
  visible: boolean;
  onClose: () => void;
}

export function NewClientModal({ visible, onClose }: NewClientModalProps) {
  const createClientMutation = useCreateClient();

  const [name, setName] = useState('');
  const [alias, setAlias] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = async () => {
    if (!name.trim()) return;

    await createClientMutation.mutateAsync({
      name: name.trim(),
      alias: alias.trim() || null,
      phone: phone.trim() || null,
      address: address.trim() || null,
      notes: notes.trim() || null,
      active: true,
    });

    setName('');
    setAlias('');
    setPhone('');
    setAddress('');
    setNotes('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title="Nuevo Cliente"
      subtitle="Datos del deudor o persona"
      footer={
        <Button
          onPress={handleSubmit}
          loading={createClientMutation.isPending}
          disabled={!name.trim()}
          fullWidth
          size="lg"
        >
          Guardar Cliente
        </Button>
      }
    >
      <Input
        label="Nombre completo *"
        placeholder="Ej. Valentina Gómez"
        value={name}
        onChangeText={setName}
      />
      <Input
        label="Celular / WhatsApp (para recordatorios)"
        placeholder="Ej. 312 345 6789"
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
      />
      <Input
        label="Alias / Negocio / Apodo (opcional)"
        placeholder="Ej. Valen Peluquería"
        value={alias}
        onChangeText={setAlias}
      />
      <Input
        label="Dirección / Barrio (opcional)"
        placeholder="Ej. Cra 80 # 25-10, Barrio Robledo"
        value={address}
        onChangeText={setAddress}
      />
      <Input
        label="Notas o referencias (opcional)"
        placeholder="Ej. Recomendada por Carlos, local en CC"
        value={notes}
        onChangeText={setNotes}
        multiline
        numberOfLines={2}
      />
    </Modal>
  );
}
