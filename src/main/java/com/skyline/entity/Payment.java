package com.skyline.entity;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;
@Entity @Table(name="payments")
public class Payment {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) @Column(name="payment_id") private Long paymentId;
 @Column(name="payment_number",nullable=false,unique=true,length=50) private String paymentNumber;
 @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="customer_id",nullable=false) private Customer customer;
 @Column(name="reservation_id") private Long reservationId;
 @Column(name="sale_id") private Long saleId;
 @Column(name="payment_type",nullable=false,length=30) private String paymentType;
 @Column(name="payment_method",nullable=false,length=30) private String paymentMethod;
 @Column(name="amount",nullable=false,precision=18,scale=2) private BigDecimal amount;
 @Column(name="currency",nullable=false,length=10) private String currency;
 @Column(name="payment_status",nullable=false,length=30) private String paymentStatus;
 @Column(name="reference_number",length=100) private String paymentReference;
 @Column(name="payment_date",nullable=false) private LocalDateTime paymentDate;
 @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="verified_by") private Staff verifiedBy;
 @Column(name="verified_at") private LocalDateTime verifiedAt;
 @Column(name="rejection_reason",length=255) private String rejectionReason;
 @Column(name="remarks",length=255) private String remarks;
 @Column(name="created_at",nullable=false,updatable=false) private LocalDateTime createdAt;
 @Column(name="updated_at",nullable=false) private LocalDateTime updatedAt;
 @Transient private BigDecimal totalPayableAmount; @Transient private BigDecimal paidAmount;
 @Transient private BigDecimal outstandingAmount; @Transient private LocalDateTime dueDate;
 @Transient private Long apartmentUnitId;
 public Payment(){}
 @PrePersist void prePersist(){LocalDateTime n=LocalDateTime.now(); if(paymentNumber==null)paymentNumber="PAY-"+UUID.randomUUID().toString().substring(0,8).toUpperCase(); if(createdAt==null)createdAt=n;if(updatedAt==null)updatedAt=n;if(paymentDate==null)paymentDate=n;if(currency==null)currency="LKR";}
 @PreUpdate void preUpdate(){updatedAt=LocalDateTime.now();}
 public Long getPaymentId(){return paymentId;} public void setPaymentId(Long v){paymentId=v;}
 public String getPaymentNumber(){return paymentNumber;} public void setPaymentNumber(String v){paymentNumber=v;}
 public Customer getCustomer(){return customer;} public void setCustomer(Customer v){customer=v;}
 public BigDecimal getAmount(){return amount;} public void setAmount(BigDecimal v){amount=v;}
 public String getPaymentType(){return paymentType;} public void setPaymentType(String v){paymentType=v;}
 public String getPaymentMethod(){return paymentMethod;} public void setPaymentMethod(String v){paymentMethod=v;}
 public String getPaymentStatus(){return paymentStatus;} public void setPaymentStatus(String v){paymentStatus=v;}
 public LocalDateTime getPaymentDate(){return paymentDate;} public void setPaymentDate(LocalDateTime v){paymentDate=v;}
 public String getRemarks(){return remarks;} public void setRemarks(String v){remarks=v;}
 public String getCurrency(){return currency;} public void setCurrency(String v){currency=v;}
 public String getPaymentReference(){return paymentReference;} public void setPaymentReference(String v){paymentReference=v;}
 public BigDecimal getTotalPayableAmount(){return totalPayableAmount!=null?totalPayableAmount:amount;} public void setTotalPayableAmount(BigDecimal v){totalPayableAmount=v;}
 public BigDecimal getPaidAmount(){return paidAmount;} public void setPaidAmount(BigDecimal v){paidAmount=v;}
 public BigDecimal getOutstandingAmount(){return outstandingAmount;} public void setOutstandingAmount(BigDecimal v){outstandingAmount=v;}
 public LocalDateTime getDueDate(){return dueDate;} public void setDueDate(LocalDateTime v){dueDate=v;}
 public Staff getVerifiedBy(){return verifiedBy;} public void setVerifiedBy(Staff v){verifiedBy=v;}
 public LocalDateTime getVerifiedAt(){return verifiedAt;} public void setVerifiedAt(LocalDateTime v){verifiedAt=v;}
 public String getRejectionReason(){return rejectionReason;} public void setRejectionReason(String v){rejectionReason=v;}
 public Long getApartmentUnitId(){return apartmentUnitId;} public void setApartmentUnitId(Long v){apartmentUnitId=v;}
 public Long getReservationId(){return reservationId;} public void setReservationId(Long v){reservationId=v;}
 public Long getSaleId(){return saleId;} public void setSaleId(Long v){saleId=v;}
 public LocalDateTime getCreatedAt(){return createdAt;} public LocalDateTime getUpdatedAt(){return updatedAt;}
}
