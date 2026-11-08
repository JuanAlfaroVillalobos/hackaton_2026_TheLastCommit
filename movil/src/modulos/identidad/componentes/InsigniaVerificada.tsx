import { useTema } from '@/compartido/tema';
import { Chip, Icono } from '@/compartido/ui';
import { View } from 'react-native';
import type { EstadoIdentidad } from '../tipos';

type Props = {
  estado: EstadoIdentidad | null | undefined;
  /** Solo el ícono ✓ (junto a un nombre en tarjetas y fichas). */
  compacta?: boolean;
};

/**
 * @description Insignia «Identidad verificada» (RF36). No muestra nada si la identidad no está VERIFICADA.
 */
export function InsigniaVerificada({ estado, compacta = false }: Props) {
  const { colores } = useTema();
  if (estado !== 'VERIFICADA') return null;

  if (compacta) {
    return (
      <View accessible accessibilityLabel="Identidad verificada">
        <Icono nombre="verified" color={colores.exito} tamano={18} />
      </View>
    );
  }
  return <Chip texto="Identidad verificada" variante="exito" icono="verified" />;
}
