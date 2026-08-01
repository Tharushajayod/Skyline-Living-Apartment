package com.skyline.entity;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
@Entity @Table(name="transactions")
public class Transaction {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) @Column(name="transaction_id") private Long transactionId;
 @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="payment_id",nullable=false) private Payment payment;
 @Column(name="transaction_number",nullable=false,unique=true,length=50) private String transactionNumber;
 @Column(name="transaction_type",nullable=false,length=30) private String transactionType;
 @Column(name="transaction_amount",nullable=false,precision=18,scale=2) private BigDecimal transactionAmount;
 @Column(name="transaction_status",nullable=false,length=30) private String transactionStatus;
 @Column(name="receipt_number",unique=true,length=100) private String receiptNumber;
 @Column(name="bank_reference",length=100) private String bankReference;
 @Column(name="gateway_reference",length=150) private String gatewayReference;
 @Column(name="cheque_number",length=100) private String chequeNumber;
 @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="processed_by",nullable=false) private Staff processedBy;
 @Column(name="processed_at",nullable=false) private LocalDateTime processedDate;
 @Column(name="remarks",length=255) private String remarks;
 @Column(name="created_at",nullable=false,updatable=false) private LocalDateTime createdAt;
 @Transient private String failureReason; @Transient private LocalDateTime updatedAt;
 public Transaction(){}
 @PrePersist void prePersist(){LocalDateTime n=LocalDateTime.now();if(processedDate==null)processedDate=n;if(createdAt==null)createdAt=n;}
 public Long getTransactionId(){return transactionId;} public void setTransactionId(Long v){transactionId=v;}
 public Payment getPayment(){return payment;} public void setPayment(Payment v){payment=v;}
 public String getTransactionNumber(){return transactionNumber;} public void setTransactionNumber(String v){transactionNumber=v;}
 public String getTransactionType(){return transactionType;} public void setTransactionType(String v){transactionType=v;}
 public String getTransactionStatus(){return transactionStatus;} public void setTransactionStatus(String v){transactionStatus=v;}
 public BigDecimal getTransactionAmount(){return transactionAmount;} public void setTransactionAmount(BigDecimal v){transactionAmount=v;}
 public Staff getProcessedBy(){return processedBy;} public void setProcessedBy(Staff v){processedBy=v;}
 public LocalDateTime getProcessedDate(){return processedDate;} public void setProcessedDate(LocalDateTime v){processedDate=v;}
 public String getReceiptNumber(){return receiptNumber;} public void setReceiptNumber(String v){receiptNumber=v;}
 public String getGatewayReference(){return gatewayReference;} public void setGatewayReference(String v){gatewayReference=v;}
 public String getBankReference(){return bankReference;} public void setBankReference(String v){bankReference=v;}
 public String getChequeNumber(){return chequeNumber;} public void setChequeNumber(String v){chequeNumber=v;}
 public String getFailureReason(){return failureReason;} public void setFailureReason(String v){failureReason=v;}
 public String getRemarks(){return remarks;} public void setRemarks(String v){remarks=v;}
 public LocalDateTime getCreatedAt(){return createdAt;} public LocalDateTime getUpdatedAt(){return updatedAt;}
}
