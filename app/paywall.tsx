import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { API_BASE_URL } from '@/config/api';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/use-colors';

interface BenefitItem {
  label: string;
  free: string;
  pro: string;
}

interface PricingItem {
  planId: string;
  period: 'MONTHLY' | 'YEARLY';
  price: number;
  originalPrice?: number | null;
  durationDays: number;
}

interface CompareData {
  benefits: BenefitItem[];
  pricing: PricingItem[];
  isCurrentlyPro: boolean;
}

interface InitiateData {
  transactionId: string;
  orderCode: string;
  qrCodeUrl: string;
  amount: number;
  transferContent: string;
  status: string;
}

interface InitiateApiResponse {
  success?: boolean;
  data?: InitiateData;
  message?: string;
}

const PENDING_STATUSES = new Set(['PENDING', 'WAITING', 'CREATED']);

export default function PaywallScreen() {
  const colors = useColors();
  const { tokens } = useAuth();
  const params = useLocalSearchParams();
  const source = (params.source as string) || 'feature';
  const mode = (params.mode as string) || 'upgrade';

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [compareData, setCompareData] = useState<CompareData | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [paymentData, setPaymentData] = useState<InitiateData | null>(null);
  const [isQrModalVisible, setIsQrModalVisible] = useState(false);
  const [statusLabel, setStatusLabel] = useState<string>('PENDING');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchCompare = async () => {
      if (!tokens?.accessToken) {
        setIsLoading(false);
        setErrorMessage('Bạn cần đăng nhập để nâng cấp.');
        return;
      }
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/payments/plans/compare`, {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${tokens.accessToken}`,
          },
        });
        if (!res.ok) {
          throw new Error('Không thể tải bảng giá.');
        }
        const json = await res.json();
        const data: CompareData = json?.data ?? json;
        setCompareData(data);
        setSelectedPlanId(data?.pricing?.[0]?.planId ?? null);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Đã có lỗi xảy ra');
      } finally {
        setIsLoading(false);
      }
    };

    void fetchCompare();
  }, [tokens?.accessToken]);

  useEffect(() => {
    if (!paymentData?.transactionId || !tokens?.accessToken) return;
    let timer: ReturnType<typeof setInterval> | null = null;
    let stopped = false;

    const pollStatus = async () => {
      if (stopped) return;
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/v1/payments/${paymentData.transactionId}/status`,
          {
            headers: {
              Authorization: `Bearer ${tokens.accessToken}`,
            },
          }
        );
        if (!res.ok) return;
        const json = await res.json();
        const status = String(json?.status ?? 'PENDING').toUpperCase();
        setStatusLabel(status);

        if (!PENDING_STATUSES.has(status)) {
          stopped = true;
          if (timer) clearInterval(timer);
          if (['PAID', 'SUCCESS', 'CONFIRMED', 'COMPLETED'].includes(status)) {
            Alert.alert('Thanh toán thành công', 'Tài khoản đã được nâng cấp Pro.');
            router.back();
          } else {
            Alert.alert('Giao dịch kết thúc', `Trạng thái hiện tại: ${status}`);
          }
        }
      } catch {
        // Keep polling silently to avoid noisy UX.
      }
    };

    void pollStatus();
    timer = setInterval(pollStatus, 3000);

    return () => {
      stopped = true;
      if (timer) clearInterval(timer);
    };
  }, [paymentData?.transactionId, tokens?.accessToken]);

  const sortedPricing = useMemo(
    () =>
      [...(compareData?.pricing ?? [])].sort((a, b) =>
        a.period === 'MONTHLY' && b.period === 'YEARLY' ? -1 : 1
      ),
    [compareData?.pricing]
  );

  const formatVnd = (amount: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

  const handleInitiatePayment = async () => {
    if (!selectedPlanId || !tokens?.accessToken) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/payments/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokens.accessToken}`,
        },
        body: JSON.stringify({ planId: selectedPlanId }),
      });

      if (!res.ok) {
        const message = await res.text().catch(() => '');
        throw new Error(message || 'Không thể khởi tạo thanh toán');
      }

      const json: InitiateApiResponse = await res.json();
      const payload = json?.data;
      if (!payload?.transactionId || !payload?.qrCodeUrl) {
        throw new Error('Du lieu QR khong hop le');
      }
      setPaymentData(payload);
      setStatusLabel(String(payload.status ?? 'PENDING').toUpperCase());
      setIsQrModalVisible(true);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Đã có lỗi xảy ra');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>
            {mode === 'renewal' ? 'Gia hạn Pro' : 'Nâng cấp Premium'}
          </Text>
          <View style={styles.closeBtn} />
        </View>

        <Text style={[styles.subTitle, { color: colors.secondaryText }]}>
          {mode === 'renewal'
            ? `Goi Pro da het han. Vui long gia han de tiep tuc (${source}).`
            : `Mở khóa tính năng cao cấp (${source}).`}
        </Text>

        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.tint} />
          </View>
        ) : (
          <>
            {(compareData?.benefits ?? []).map((benefit, idx) => (
              <View key={`${benefit.label}-${idx}`} style={[styles.benefitRow, { backgroundColor: colors.cardBg }]}>
                <Text style={[styles.benefitLabel, { color: colors.text }]}>{benefit.label}</Text>
                <Text style={[styles.benefitText, { color: colors.mutedText }]}>Free: {benefit.free}</Text>
                <Text style={[styles.benefitText, { color: colors.tint }]}>Pro: {benefit.pro}</Text>
              </View>
            ))}

            <Text style={[styles.sectionTitle, { color: colors.text }]}>Chọn gói cước</Text>
            {sortedPricing.map((plan) => {
              const active = selectedPlanId === plan.planId;
              return (
                <TouchableOpacity
                  key={plan.planId}
                  style={[
                    styles.planCard,
                    {
                      backgroundColor: colors.cardBg,
                      borderColor: active ? colors.tint : colors.border,
                    },
                  ]}
                  onPress={() => setSelectedPlanId(plan.planId)}
                >
                  <Text style={[styles.planTitle, { color: colors.text }]}>
                    {plan.period === 'MONTHLY' ? 'Pro Tháng' : 'Pro Năm'}
                  </Text>
                  <Text style={[styles.planPrice, { color: colors.tint }]}>{formatVnd(plan.price)}</Text>
                  <Text style={[styles.planDuration, { color: colors.secondaryText }]}>
                    {plan.durationDays} ngày
                  </Text>
                </TouchableOpacity>
              );
            })}

            {!paymentData ? (
              <TouchableOpacity
                style={[styles.payBtn, { backgroundColor: colors.tint, opacity: isSubmitting ? 0.7 : 1 }]}
                onPress={handleInitiatePayment}
                disabled={isSubmitting || !selectedPlanId}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.payBtnText}>Thực hiện thanh toán</Text>
                )}
              </TouchableOpacity>
            ) : (
              <View style={[styles.qrCard, { backgroundColor: colors.cardBg }]}>
                <Text style={[styles.qrTitle, { color: colors.text }]}>Chuyển khoản qua SePay</Text>
                <Text style={[styles.qrText, { color: colors.secondaryText }]}>
                  Noi dung: {paymentData.transferContent}
                </Text>
                <Text style={[styles.qrText, { color: colors.secondaryText }]}>
                  Số tiền: {formatVnd(paymentData.amount)}
                </Text>
                <TouchableOpacity onPress={() => Linking.openURL(paymentData.qrCodeUrl)}>
                  <Text style={[styles.qrLink, { color: colors.tint }]}>Mở QR để thanh toán</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setIsQrModalVisible(true)}>
                  <Text style={[styles.qrLink, { color: colors.tint }]}>Xem popup QR code   </Text>
                </TouchableOpacity>
                <Text style={[styles.statusText, { color: colors.text }]}>Trạng thái: {statusLabel}</Text>
              </View>
            )}
          </>
        )}

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
      </ScrollView>

      <Modal
        visible={isQrModalVisible && !!paymentData}
        transparent
        animationType="fade"
        onRequestClose={() => setIsQrModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.cardBg }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Quét QR để thanh toán</Text>
              <TouchableOpacity onPress={() => setIsQrModalVisible(false)}>
                <Ionicons name="close" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>
            {paymentData?.qrCodeUrl ? (
              <Image source={{ uri: paymentData.qrCodeUrl }} style={styles.qrImage} resizeMode="contain" />
            ) : null}
            <Text style={[styles.qrText, { color: colors.secondaryText }]}>
              Số tiền: {paymentData ? formatVnd(paymentData.amount) : '--'}
            </Text>
            <Text style={[styles.qrText, { color: colors.secondaryText }]}>
              Nội dung: {paymentData?.transferContent ?? '--'}
            </Text>
            <Text style={[styles.statusText, { color: colors.text }]}>Trạng thái: {statusLabel}</Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  closeBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '700' },
  subTitle: { marginTop: 8, marginBottom: 16, fontSize: 13 },
  centered: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  benefitRow: { borderRadius: 12, padding: 12, marginBottom: 10 },
  benefitLabel: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  benefitText: { fontSize: 12, marginBottom: 2 },
  sectionTitle: { marginTop: 12, marginBottom: 10, fontSize: 16, fontWeight: '700' },
  planCard: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 10 },
  planTitle: { fontSize: 14, fontWeight: '600' },
  planPrice: { fontSize: 18, fontWeight: '700', marginTop: 4 },
  planDuration: { fontSize: 12, marginTop: 2 },
  payBtn: { marginTop: 8, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  payBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  qrCard: { borderRadius: 12, padding: 14, marginTop: 12 },
  qrTitle: { fontSize: 15, fontWeight: '700', marginBottom: 8 },
  qrText: { fontSize: 13, marginBottom: 4 },
  qrLink: { fontSize: 14, fontWeight: '700', marginTop: 8 },
  statusText: { fontSize: 13, marginTop: 10, fontWeight: '600' },
  errorText: { color: '#EF4444', marginTop: 10, fontSize: 13 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 14,
    padding: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  modalTitle: { fontSize: 16, fontWeight: '700' },
  qrImage: {
    width: '100%',
    height: 260,
    borderRadius: 12,
    marginBottom: 8,
  },
});

