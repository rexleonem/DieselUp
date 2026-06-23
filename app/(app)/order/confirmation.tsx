import { Redirect, useLocalSearchParams } from 'expo-router';

export default function ConfirmationStep() {
  const { orderId } = useLocalSearchParams<{ orderId?: string }>();
  return <Redirect href={{ pathname: '/order/acknowledgement' as never, params: { orderId: orderId ?? '' } }} />;
}
