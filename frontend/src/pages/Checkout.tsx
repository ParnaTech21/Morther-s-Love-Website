import { FormEvent, useState } from 'react';
import {
  Box, Button, Container, Divider, Flex, FormControl, FormHelperText, FormLabel, Grid, Heading, Input, Radio, RadioGroup,
  Stack, Text, Textarea, useToast,
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { api } from '../api';
import { useCart } from '../cart';
import { money, PAYMENT } from '../shop';

const METHODS = [
  { id: 'Cash', label: 'Cash', hint: 'Pay when you receive or collect your order.' },
  { id: 'MTN', label: 'MTN Mobile Money', hint: '' },
  { id: 'Airtel', label: 'Airtel Money', hint: '' },
];
const LABEL: Record<string, string> = { MTN: 'MTN Mobile Money', Airtel: 'Airtel Money' };

export default function Checkout() {
  const cart = useCart();
  const toast = useToast();
  const [f, setF] = useState({ name: '', phone: '', address: '', notes: '', paymentMethod: 'Cash', paymentReference: '' });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ reference: string; total: number; method: string; phone: string } | null>(null);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  const momo = f.paymentMethod !== 'Cash';
  const number = f.paymentMethod === 'MTN' ? PAYMENT.mtn : PAYMENT.airtel;

  if (done) return (
    <Container maxW="2xl" py={16}>
      <Heading as="h1" fontSize={{ base: '3xl', md: '5xl' }}>Order received</Heading>
      <Box layerStyle="stitched" p={6} mt={8}>
        <Text>Your order number is</Text>
        <Heading size="lg" my={2}>{done.reference}</Heading>
        <Text>
          {done.method === 'Cash'
            ? `Please have ${money(done.total)} ready. We’ll call you on ${done.phone} to confirm delivery or collection.`
            : `We’ll check your ${LABEL[done.method]} payment of ${money(done.total)} and call you on ${done.phone} to confirm.`}
        </Text>
      </Box>
      <Button as={RouterLink} to="/shop" mt={8}>CONTINUE SHOPPING</Button>
    </Container>
  );

  if (cart.items.length === 0) return (
    <Container maxW="2xl" py={16}>
      <Heading as="h1" fontSize={{ base: '3xl', md: '5xl' }}>Checkout</Heading>
      <Text mt={4}>Your cart is empty.</Text>
      <Button as={RouterLink} to="/shop" mt={6}>BROWSE THE SHOP</Button>
    </Container>
  );

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await api.placeOrder({ ...f, items: cart.items.map((i) => ({ productId: i.id, quantity: i.qty })) });
      setDone({ ...res, method: f.paymentMethod, phone: f.phone });
      cart.clear();
    } catch (err) {
      toast({ status: 'error', title: (err as Error).message });
    } finally { setBusy(false); }
  };

  return (
    <Container maxW="6xl" py={12}>
      <Heading as="h1" fontSize={{ base: '3xl', md: '5xl' }} mb={8}>Checkout</Heading>
      <Grid templateColumns={{ base: '1fr', md: '3fr 2fr' }} gap={10}>
        <Stack as="form" onSubmit={submit} spacing={5}>
          <FormControl isRequired><FormLabel>Full name</FormLabel><Input bg="white" value={f.name} maxLength={80} onChange={set('name')} autoComplete="name" /></FormControl>
          <FormControl isRequired><FormLabel>Phone number</FormLabel><Input bg="white" type="tel" value={f.phone} maxLength={20} onChange={set('phone')} autoComplete="tel" />
            <FormHelperText>We’ll call you on this number to confirm your order.</FormHelperText></FormControl>
          <FormControl isRequired><FormLabel>Delivery address or pickup note</FormLabel><Textarea bg="white" rows={3} value={f.address} maxLength={300} onChange={set('address')} /></FormControl>
          <FormControl><FormLabel>Order notes (optional)</FormLabel><Textarea bg="white" rows={2} value={f.notes} maxLength={500} onChange={set('notes')} /></FormControl>

          <FormControl as="fieldset">
            <FormLabel as="legend">Payment method</FormLabel>
            <RadioGroup value={f.paymentMethod} onChange={(v) => setF({ ...f, paymentMethod: v })}>
              <Stack spacing={3}>
                {METHODS.map((m) => (
                  <Radio key={m.id} value={m.id} colorScheme="plum">
                    <Text fontWeight="500">{m.label}</Text>
                    {m.hint && <Text fontSize="sm" color="gray.600">{m.hint}</Text>}
                  </Radio>
                ))}
              </Stack>
            </RadioGroup>
          </FormControl>

          {momo && (
            <Box layerStyle="stitched" p={5}>
              <Text>Send <b>{money(cart.total)}</b> with {LABEL[f.paymentMethod]} to <b>{number}</b> ({PAYMENT.accountName}), then enter the transaction ID from your confirmation message.</Text>
              <FormControl isRequired mt={4}><FormLabel>Transaction ID</FormLabel>
                <Input value={f.paymentReference} maxLength={60} onChange={set('paymentReference')} /></FormControl>
            </Box>
          )}
          <Button type="submit" size="lg" isLoading={busy} alignSelf="flex-start" px={10}>PLACE ORDER</Button>
        </Stack>

        <Box layerStyle="stitched" p={6} alignSelf="start">
          <Heading as="h2" size="md" mb={4}>Your order</Heading>
          <Stack spacing={3} divider={<Divider />}>
            {cart.items.map((i) => (
              <Flex key={i.id} justify="space-between" gap={3}><Text>{i.qty} × {i.name}</Text><Text>{money(i.price * i.qty)}</Text></Flex>
            ))}
          </Stack>
          <Flex justify="space-between" mt={5} fontWeight="700" fontSize="lg"><Text>Total</Text><Text>{money(cart.total)}</Text></Flex>
          <Text fontSize="sm" color="gray.600" mt={2}>Delivery cost, if any, is confirmed when we call you.</Text>
        </Box>
      </Grid>
    </Container>
  );
}
