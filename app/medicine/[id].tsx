import { useLocalSearchParams } from 'expo-router';
import NewMedicineForm from '../../src/components/NewMedicineForm';

export default function EditMedicineScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <NewMedicineForm medicineId={id} />;
}
