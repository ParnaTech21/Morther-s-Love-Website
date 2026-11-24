import { FormEvent, useEffect, useState } from 'react';
import {
  Badge, Box, Button, Checkbox, Flex, Select, Container, FormControl, FormLabel, Heading, HStack, Input, Link, Modal, ModalBody,
  ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, Stack, Tab, Table, TableContainer, TabList,
  TabPanel, TabPanels, Tabs, Tbody, Td, Text, Textarea, Th, Thead, Tr, useToast,
} from '@chakra-ui/react';
import { AdminOrder, AdminReview, api, auth, Message, Product, ProductInput } from '../api';
import { money } from '../shop';

const useFail = () => { const t = useToast(); return (e: unknown) => t({ status: 'error', title: (e as Error).message }); };

function Login({ onLogin }: { onLogin: () => void }) {
  const [u, setU] = useState(''); const [p, setP] = useState(''); const [busy, setBusy] = useState(false);
  const toast = useToast();
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true);
    try { auth.set((await api.login(u, p)).token); onLogin(); }
    catch { toast({ status: 'error', title: 'Wrong username or password.' }); }
    finally { setBusy(false); }
  };
  return (
    <Container maxW="sm" py={16}>
      <Box as="form" onSubmit={submit} layerStyle="stitched" p={8}>
        <Heading size="lg" mb={5}>Staff login</Heading>
        <Stack spacing={4}>
          <FormControl isRequired><FormLabel>Username</FormLabel><Input autoComplete="username" value={u} onChange={(e) => setU(e.target.value)} /></FormControl>
          <FormControl isRequired><FormLabel>Password</FormLabel><Input type="password" autoComplete="current-password" value={p} onChange={(e) => setP(e.target.value)} /></FormControl>
          <Button type="submit" isLoading={busy}>Log in</Button>
        </Stack>
      </Box>
    </Container>
  );
}

const blank: ProductInput = { name: '', description: '', price: 0, category: '', imageUrl: '', isAvailable: true };

function ProductsTab() {
  const [rows, setRows] = useState<Product[]>([]);
  const [editing, setEditing] = useState<(ProductInput & { id?: number }) | null>(null);
  const toast = useToast(); const fail = useFail();
  const load = () => api.admin.products().then(setRows).catch(fail);
  useEffect(() => { load(); }, []);
  const set = (k: keyof ProductInput, v: string | number | boolean) => setEditing((x) => x && { ...x, [k]: v });

  const save = async (e: FormEvent) => {
    e.preventDefault(); if (!editing) return;
    try {
      const { id, ...input } = editing;
      await api.admin.saveProduct(input, id);
      toast({ status: 'success', title: 'Product saved' }); setEditing(null); load();
    } catch (err) { fail(err); }
  };
  const remove = async (p: Product) => {
    if (!confirm(`Delete “${p.name}” and its reviews?`)) return;
    try { await api.admin.deleteProduct(p.id); toast({ status: 'success', title: 'Product deleted' }); load(); } catch (err) { fail(err); }
  };

  return (
    <>
      <Button mb={4} onClick={() => setEditing({ ...blank })}>Add product</Button>
      <TableContainer>
        <Table size="sm">
          <Thead><Tr><Th>Name</Th><Th>Category</Th><Th isNumeric>Price</Th><Th>Status</Th><Th /></Tr></Thead>
          <Tbody>
            {rows.map((p) => (
              <Tr key={p.id}>
                <Td>{p.name}</Td><Td>{p.category}</Td><Td isNumeric>{money(p.price)}</Td>
                <Td><Badge colorScheme={p.isAvailable ? 'green' : 'gray'}>{p.isAvailable ? 'Visible' : 'Hidden'}</Badge></Td>
                <Td><HStack justify="flex-end">
                  <Button size="xs" variant="outline" onClick={() => setEditing({ ...p })}>Edit</Button>
                  <Button size="xs" variant="ghost" colorScheme="red" onClick={() => remove(p)}>Delete</Button>
                </HStack></Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>
      {rows.length === 0 && <Text mt={4} color="gray.600">No products yet. Add your first one.</Text>}

      <Modal isOpen={!!editing} onClose={() => setEditing(null)} size="lg">
        <ModalOverlay />
        <ModalContent as="form" onSubmit={save}>
          <ModalHeader>{editing?.id ? 'Edit product' : 'Add product'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {editing && (
              <Stack spacing={3}>
                <FormControl isRequired><FormLabel>Name</FormLabel><Input value={editing.name} onChange={(e) => set('name', e.target.value)} /></FormControl>
                <FormControl isRequired><FormLabel>Category</FormLabel><Input value={editing.category} onChange={(e) => set('category', e.target.value)} /></FormControl>
                <FormControl isRequired><FormLabel>Price</FormLabel><Input type="number" min={0} step="1" value={editing.price} onChange={(e) => set('price', Number(e.target.value))} /></FormControl>
                <FormControl><FormLabel>Image link</FormLabel><Input placeholder="https://…" value={editing.imageUrl} onChange={(e) => set('imageUrl', e.target.value)} /></FormControl>
                <FormControl><FormLabel>Description</FormLabel><Textarea value={editing.description} onChange={(e) => set('description', e.target.value)} /></FormControl>
                <Checkbox isChecked={editing.isAvailable} onChange={(e) => set('isAvailable', e.target.checked)}>Show in the shop</Checkbox>
              </Stack>
            )}
          </ModalBody>
          <ModalFooter gap={3}><Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button><Button type="submit">Save product</Button></ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

function ReviewsTab() {
  const [rows, setRows] = useState<AdminReview[]>([]);
  const toast = useToast(); const fail = useFail();
  const load = () => api.admin.reviews().then(setRows).catch(fail);
  useEffect(() => { load(); }, []);
  const act = async (fn: () => Promise<void>, title: string) => { try { await fn(); toast({ status: 'success', title }); load(); } catch (e) { fail(e); } };

  return rows.length === 0 ? <Text color="gray.600">No reviews yet.</Text> : (
    <TableContainer>
      <Table size="sm">
        <Thead><Tr><Th>Product</Th><Th>Author</Th><Th>Rating</Th><Th>Comment</Th><Th>Status</Th><Th /></Tr></Thead>
        <Tbody>
          {rows.map((r) => (
            <Tr key={r.id}>
              <Td>{r.productName}</Td><Td>{r.author}</Td><Td>{r.rating}/5</Td>
              <Td whiteSpace="normal" maxW="320px">{r.comment}</Td>
              <Td><Badge colorScheme={r.approved ? 'green' : 'orange'}>{r.approved ? 'Published' : 'Waiting'}</Badge></Td>
              <Td><HStack justify="flex-end">
                {!r.approved && <Button size="xs" onClick={() => act(() => api.admin.approveReview(r.id), 'Review published')}>Approve</Button>}
                <Button size="xs" variant="ghost" colorScheme="red" onClick={() => confirm('Delete this review?') && act(() => api.admin.deleteReview(r.id), 'Review deleted')}>Delete</Button>
              </HStack></Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </TableContainer>
  );
}

function OrdersTab() {
  const [rows, setRows] = useState<AdminOrder[]>([]);
  const toast = useToast(); const fail = useFail();
  const load = () => api.admin.orders().then(setRows).catch(fail);
  useEffect(() => { load(); }, []);
  const setStatus = async (id: number, status: string) => {
    try { await api.admin.setOrderStatus(id, status); toast({ status: 'success', title: 'Order updated' }); load(); } catch (e) { fail(e); }
  };
  return rows.length === 0 ? <Text color="gray.600">No orders yet.</Text> : (
    <Stack spacing={4}>
      {rows.map((o) => (
        <Box key={o.id} layerStyle="stitched" p={4}>
          <Flex justify="space-between" wrap="wrap" gap={3}>
            <Box>
              <Text fontWeight="700">{o.reference} - {money(o.total)}</Text>
              <Text>{o.customerName}, <Link href={`tel:${o.phone}`} color="plum.600">{o.phone}</Link></Text>
              <Text fontSize="sm" color="gray.600">{o.address}</Text>
              {o.notes && <Text fontSize="sm">Note: {o.notes}</Text>}
              <Text fontSize="sm" mt={1}>Payment: {o.paymentMethod}{o.paymentReference ? ` (transaction ID ${o.paymentReference})` : ''}</Text>
            </Box>
            <Select w="160px" value={o.status} aria-label={`Status for ${o.reference}`} onChange={(e) => setStatus(o.id, e.target.value)}>
              {['New', 'Paid', 'Completed', 'Cancelled'].map((s) => <option key={s}>{s}</option>)}
            </Select>
          </Flex>
          <Text mt={3} fontSize="sm">{o.items.map((i) => `${i.quantity} × ${i.productName}`).join(', ')}</Text>
          <Text mt={1} fontSize="xs" color="gray.600">{new Date(o.createdAt).toLocaleString()}</Text>
        </Box>
      ))}
    </Stack>
  );
}

function MessagesTab() {
  const [rows, setRows] = useState<Message[]>([]);
  const fail = useFail();
  useEffect(() => { api.admin.messages().then(setRows).catch(fail); }, []);
  return rows.length === 0 ? <Text color="gray.600">No messages yet.</Text> : (
    <Stack spacing={4}>
      {rows.map((m) => (
        <Box key={m.id} layerStyle="stitched" p={4}>
          <Text fontWeight="700">{m.name} <Link href={`mailto:${m.email}`} color="plum.600" fontWeight="400">{m.email}</Link></Text>
          <Text mt={2} whiteSpace="pre-line">{m.message}</Text>
          <Text mt={2} fontSize="sm" color="gray.600">{new Date(m.createdAt).toLocaleString()}</Text>
        </Box>
      ))}
    </Stack>
  );
}

export default function Admin() {
  const [authed, setAuthed] = useState(!!auth.get());
  useEffect(() => {
    const out = () => setAuthed(false);
    window.addEventListener('mlc-logout', out);
    return () => window.removeEventListener('mlc-logout', out);
  }, []);
  if (!authed) return <Login onLogin={() => setAuthed(true)} />;
  return (
    <Container maxW="6xl" py={10}>
      <HStack justify="space-between" mb={6}>
        <Heading as="h1" size="xl">Dashboard</Heading>
        <Button variant="outline" onClick={() => { auth.clear(); setAuthed(false); }}>Log out</Button>
      </HStack>
      <Tabs isLazy colorScheme="plum">
        <TabList><Tab>Orders</Tab><Tab>Products</Tab><Tab>Reviews</Tab><Tab>Messages</Tab></TabList>
        <TabPanels>
          <TabPanel px={0}><OrdersTab /></TabPanel>
          <TabPanel px={0}><ProductsTab /></TabPanel>
          <TabPanel px={0}><ReviewsTab /></TabPanel>
          <TabPanel px={0}><MessagesTab /></TabPanel>
        </TabPanels>
      </Tabs>
    </Container>
  );
}
