// Code generated by protoc-gen-gogo. DO NOT EDIT.
// source: evmos/recovery/v1/genesis.proto

package types

import (
	fmt "fmt"
	io "io"
	math "math"
	math_bits "math/bits"
	time "time"

	_ "github.com/cosmos/gogoproto/gogoproto"
	proto "github.com/gogo/protobuf/proto"
	github_com_gogo_protobuf_types "github.com/gogo/protobuf/types"
	_ "google.golang.org/protobuf/types/known/durationpb"
)

// Reference imports to suppress errors if they are not otherwise used.
var (
	_ = proto.Marshal
	_ = fmt.Errorf
	_ = math.Inf
	_ = time.Kitchen
)

// This is a compile-time assertion to ensure that this generated file
// is compatible with the proto package it is being compiled against.
// A compilation error at this line likely means your copy of the
// proto package needs to be updated.
const _ = proto.GoGoProtoPackageIsVersion3 // please upgrade the proto package

// V2GenesisState defines the recovery module's genesis state.
type V2GenesisState struct {
	// V2Params defines all the paramaters of the module.
	V2Params V2Params `protobuf:"bytes,1,opt,name=V2Params,proto3" json:"V2Params"`
}

func (m *V2GenesisState) Reset()         { *m = V2GenesisState{} }
func (m *V2GenesisState) String() string { return proto.CompactTextString(m) }
func (*V2GenesisState) ProtoMessage()    {}
func (*V2GenesisState) Descriptor() ([]byte, []int) {
	return fileDescriptor_8a3e70cb61e26f25, []int{0}
}

func (m *V2GenesisState) XXX_Unmarshal(b []byte) error {
	return m.Unmarshal(b)
}

func (m *V2GenesisState) XXX_Marshal(b []byte, deterministic bool) ([]byte, error) {
	if deterministic {
		return xxx_messageInfo_V2GenesisState.Marshal(b, m, deterministic)
	} else {
		b = b[:cap(b)]
		n, err := m.MarshalToSizedBuffer(b)
		if err != nil {
			return nil, err
		}
		return b[:n], nil
	}
}

func (m *V2GenesisState) XXX_Merge(src proto.Message) {
	xxx_messageInfo_V2GenesisState.Merge(m, src)
}

func (m *V2GenesisState) XXX_Size() int {
	return m.Size()
}

func (m *V2GenesisState) XXX_DiscardUnknown() {
	xxx_messageInfo_V2GenesisState.DiscardUnknown(m)
}

var xxx_messageInfo_V2GenesisState proto.InternalMessageInfo

func (m *V2GenesisState) GetV2Params() V2Params {
	if m != nil {
		return m.V2Params
	}
	return V2Params{}
}

// V2Params holds parameters for the recovery module
type V2Params struct {
	// enable_recovery IBC middleware
	EnableRecovery bool `protobuf:"varint,1,opt,name=enable_recovery,json=enableRecovery,proto3" json:"enable_recovery,omitempty"`
	// packet_timeout_duration is the duration added to timeout timestamp for balances recovered via IBC packets
	PacketTimeoutDuration time.Duration `protobuf:"bytes,2,opt,name=packet_timeout_duration,json=packetTimeoutDuration,proto3,stdduration" json:"packet_timeout_duration"`
}

func (m *V2Params) Reset()         { *m = V2Params{} }
func (m *V2Params) String() string { return proto.CompactTextString(m) }
func (*V2Params) ProtoMessage()    {}
func (*V2Params) Descriptor() ([]byte, []int) {
	return fileDescriptor_8a3e70cb61e26f25, []int{1}
}

func (m *V2Params) XXX_Unmarshal(b []byte) error {
	return m.Unmarshal(b)
}

func (m *V2Params) XXX_Marshal(b []byte, deterministic bool) ([]byte, error) {
	if deterministic {
		return xxx_messageInfo_V2Params.Marshal(b, m, deterministic)
	} else {
		b = b[:cap(b)]
		n, err := m.MarshalToSizedBuffer(b)
		if err != nil {
			return nil, err
		}
		return b[:n], nil
	}
}

func (m *V2Params) XXX_Merge(src proto.Message) {
	xxx_messageInfo_V2Params.Merge(m, src)
}

func (m *V2Params) XXX_Size() int {
	return m.Size()
}

func (m *V2Params) XXX_DiscardUnknown() {
	xxx_messageInfo_V2Params.DiscardUnknown(m)
}

var xxx_messageInfo_V2Params proto.InternalMessageInfo

func (m *V2Params) GetEnableRecovery() bool {
	if m != nil {
		return m.EnableRecovery
	}
	return false
}

func (m *V2Params) GetPacketTimeoutDuration() time.Duration {
	if m != nil {
		return m.PacketTimeoutDuration
	}
	return 0
}

func init() {
	proto.RegisterType((*V2GenesisState)(nil), "evmos.recovery.v1.V2GenesisState")
	proto.RegisterType((*V2Params)(nil), "evmos.recovery.v1.V2Params")
}

func init() { proto.RegisterFile("evmos/recovery/v1/genesis.proto", fileDescriptor_8a3e70cb61e26f25) }

var fileDescriptor_8a3e70cb61e26f25 = []byte{
	// 293 bytes of a gzipped FileDescriptorProto
	0x1f, 0x8b, 0x08, 0x00, 0x00, 0x00, 0x00, 0x00, 0x02, 0xff, 0x64, 0x90, 0xb1, 0x4b, 0xc4, 0x30,
	0x14, 0xc6, 0x1b, 0x91, 0xe3, 0x88, 0xa2, 0x58, 0x14, 0xcf, 0x1b, 0x72, 0x72, 0x8b, 0x82, 0x90,
	0x58, 0x1d, 0xdc, 0x0f, 0xe5, 0x56, 0xa9, 0x4e, 0x3a, 0x94, 0xb4, 0x3e, 0x63, 0xf1, 0xda, 0x57,
	0xda, 0xb4, 0x78, 0xff, 0x84, 0x38, 0xfa, 0x27, 0xdd, 0x78, 0xa3, 0x93, 0x4a, 0xfb, 0x8f, 0xc8,
	0x25, 0xad, 0x0e, 0x2e, 0x21, 0x79, 0xdf, 0x2f, 0xdf, 0xf7, 0xf1, 0xe8, 0x08, 0xaa, 0x04, 0x0b,
	0x91, 0x43, 0x84, 0x15, 0xe4, 0x73, 0x51, 0x79, 0x42, 0x41, 0x0a, 0x45, 0x5c, 0xf0, 0x2c, 0x47,
	0x8d, 0xee, 0x8e, 0x01, 0x78, 0x07, 0xf0, 0xca, 0x1b, 0xee, 0x2a, 0x54, 0x68, 0x54, 0xb1, 0xba,
	0x59, 0x70, 0xc8, 0x14, 0xa2, 0x9a, 0x81, 0x30, 0xaf, 0xb0, 0x7c, 0x14, 0x0f, 0x65, 0x2e, 0x75,
	0x8c, 0xa9, 0xd5, 0xc7, 0x53, 0xba, 0x39, 0xb5, 0xce, 0x37, 0x5a, 0x6a, 0x70, 0x2f, 0x68, 0x2f,
	0x93, 0xb9, 0x4c, 0x8a, 0x01, 0x39, 0x24, 0xc7, 0x1b, 0x67, 0x07, 0xfc, 0x5f, 0x12, 0xbf, 0x36,
	0xc0, 0x64, 0x7d, 0xf1, 0x39, 0x72, 0xfc, 0x16, 0x1f, 0xbf, 0x12, 0xda, 0xb3, 0x82, 0x7b, 0x44,
	0xb7, 0x21, 0x95, 0xe1, 0x0c, 0x82, 0xee, 0x97, 0x31, 0xeb, 0xfb, 0x5b, 0x76, 0xec, 0xb7, 0x53,
	0xf7, 0x9e, 0xee, 0x67, 0x32, 0x7a, 0x06, 0x1d, 0xe8, 0x38, 0x01, 0x2c, 0x75, 0xd0, 0xb5, 0x1b,
	0xac, 0xb5, 0xe9, 0xb6, 0x3e, 0xef, 0xea, 0xf3, 0xcb, 0x16, 0x98, 0xf4, 0x57, 0xe9, 0xef, 0x5f,
	0x23, 0xe2, 0xef, 0x59, 0x8f, 0x5b, 0x6b, 0xf1, 0x0b, 0x5c, 0x2d, 0x6a, 0x46, 0x96, 0x35, 0x23,
	0xdf, 0x35, 0x23, 0x6f, 0x0d, 0x73, 0x96, 0x0d, 0x73, 0x3e, 0x1a, 0xe6, 0xdc, 0x9d, 0xa8, 0x58,
	0x3f, 0x95, 0x21, 0x8f, 0x30, 0x11, 0x76, 0xd1, 0xf6, 0xac, 0xbc, 0x53, 0xf1, 0xf2, 0xb7, 0x74,
	0x3d, 0xcf, 0xa0, 0x08, 0x7b, 0x26, 0xfa, 0xfc, 0x27, 0x00, 0x00, 0xff, 0xff, 0xd1, 0x7f, 0x73,
	0x69, 0x93, 0x01, 0x00, 0x00,
}

func (m *V2GenesisState) Marshal() (dAtA []byte, err error) {
	size := m.Size()
	dAtA = make([]byte, size)
	n, err := m.MarshalToSizedBuffer(dAtA[:size])
	if err != nil {
		return nil, err
	}
	return dAtA[:n], nil
}

func (m *V2GenesisState) MarshalTo(dAtA []byte) (int, error) {
	size := m.Size()
	return m.MarshalToSizedBuffer(dAtA[:size])
}

func (m *V2GenesisState) MarshalToSizedBuffer(dAtA []byte) (int, error) {
	i := len(dAtA)
	_ = i
	var l int
	_ = l
	{
		size, err := m.V2Params.MarshalToSizedBuffer(dAtA[:i])
		if err != nil {
			return 0, err
		}
		i -= size
		i = encodeVarintGenesis(dAtA, i, uint64(size))
	}
	i--
	dAtA[i] = 0xa
	return len(dAtA) - i, nil
}

func (m *V2Params) Marshal() (dAtA []byte, err error) {
	size := m.Size()
	dAtA = make([]byte, size)
	n, err := m.MarshalToSizedBuffer(dAtA[:size])
	if err != nil {
		return nil, err
	}
	return dAtA[:n], nil
}

func (m *V2Params) MarshalTo(dAtA []byte) (int, error) {
	size := m.Size()
	return m.MarshalToSizedBuffer(dAtA[:size])
}

func (m *V2Params) MarshalToSizedBuffer(dAtA []byte) (int, error) {
	i := len(dAtA)
	_ = i
	var l int
	_ = l
	n2, err2 := github_com_gogo_protobuf_types.StdDurationMarshalTo(m.PacketTimeoutDuration, dAtA[i-github_com_gogo_protobuf_types.SizeOfStdDuration(m.PacketTimeoutDuration):])
	if err2 != nil {
		return 0, err2
	}
	i -= n2
	i = encodeVarintGenesis(dAtA, i, uint64(n2))
	i--
	dAtA[i] = 0x12
	if m.EnableRecovery {
		i--
		if m.EnableRecovery {
			dAtA[i] = 1
		} else {
			dAtA[i] = 0
		}
		i--
		dAtA[i] = 0x8
	}
	return len(dAtA) - i, nil
}

func encodeVarintGenesis(dAtA []byte, offset int, v uint64) int {
	offset -= sovGenesis(v)
	base := offset
	for v >= 1<<7 {
		dAtA[offset] = uint8(v&0x7f | 0x80)
		v >>= 7
		offset++
	}
	dAtA[offset] = uint8(v)
	return base
}

func (m *V2GenesisState) Size() (n int) {
	if m == nil {
		return 0
	}
	var l int
	_ = l
	l = m.V2Params.Size()
	n += 1 + l + sovGenesis(uint64(l))
	return n
}

func (m *V2Params) Size() (n int) {
	if m == nil {
		return 0
	}
	var l int
	_ = l
	if m.EnableRecovery {
		n += 2
	}
	l = github_com_gogo_protobuf_types.SizeOfStdDuration(m.PacketTimeoutDuration)
	n += 1 + l + sovGenesis(uint64(l))
	return n
}

func sovGenesis(x uint64) (n int) {
	return (math_bits.Len64(x|1) + 6) / 7
}

func sozGenesis(x uint64) (n int) {
	return sovGenesis(uint64((x << 1) ^ uint64((int64(x) >> 63))))
}

func (m *V2GenesisState) Unmarshal(dAtA []byte) error {
	l := len(dAtA)
	iNdEx := 0
	for iNdEx < l {
		preIndex := iNdEx
		var wire uint64
		for shift := uint(0); ; shift += 7 {
			if shift >= 64 {
				return ErrIntOverflowGenesis
			}
			if iNdEx >= l {
				return io.ErrUnexpectedEOF
			}
			b := dAtA[iNdEx]
			iNdEx++
			wire |= uint64(b&0x7F) << shift
			if b < 0x80 {
				break
			}
		}
		fieldNum := int32(wire >> 3)
		wireType := int(wire & 0x7)
		if wireType == 4 {
			return fmt.Errorf("proto: V2GenesisState: wiretype end group for non-group")
		}
		if fieldNum <= 0 {
			return fmt.Errorf("proto: V2GenesisState: illegal tag %d (wire type %d)", fieldNum, wire)
		}
		switch fieldNum {
		case 1:
			if wireType != 2 {
				return fmt.Errorf("proto: wrong wireType = %d for field V2Params", wireType)
			}
			var msglen int
			for shift := uint(0); ; shift += 7 {
				if shift >= 64 {
					return ErrIntOverflowGenesis
				}
				if iNdEx >= l {
					return io.ErrUnexpectedEOF
				}
				b := dAtA[iNdEx]
				iNdEx++
				msglen |= int(b&0x7F) << shift
				if b < 0x80 {
					break
				}
			}
			if msglen < 0 {
				return ErrInvalidLengthGenesis
			}
			postIndex := iNdEx + msglen
			if postIndex < 0 {
				return ErrInvalidLengthGenesis
			}
			if postIndex > l {
				return io.ErrUnexpectedEOF
			}
			if err := m.V2Params.Unmarshal(dAtA[iNdEx:postIndex]); err != nil {
				return err
			}
			iNdEx = postIndex
		default:
			iNdEx = preIndex
			skippy, err := skipGenesis(dAtA[iNdEx:])
			if err != nil {
				return err
			}
			if (skippy < 0) || (iNdEx+skippy) < 0 {
				return ErrInvalidLengthGenesis
			}
			if (iNdEx + skippy) > l {
				return io.ErrUnexpectedEOF
			}
			iNdEx += skippy
		}
	}

	if iNdEx > l {
		return io.ErrUnexpectedEOF
	}
	return nil
}

func (m *V2Params) Unmarshal(dAtA []byte) error {
	l := len(dAtA)
	iNdEx := 0
	for iNdEx < l {
		preIndex := iNdEx
		var wire uint64
		for shift := uint(0); ; shift += 7 {
			if shift >= 64 {
				return ErrIntOverflowGenesis
			}
			if iNdEx >= l {
				return io.ErrUnexpectedEOF
			}
			b := dAtA[iNdEx]
			iNdEx++
			wire |= uint64(b&0x7F) << shift
			if b < 0x80 {
				break
			}
		}
		fieldNum := int32(wire >> 3)
		wireType := int(wire & 0x7)
		if wireType == 4 {
			return fmt.Errorf("proto: V2Params: wiretype end group for non-group")
		}
		if fieldNum <= 0 {
			return fmt.Errorf("proto: V2Params: illegal tag %d (wire type %d)", fieldNum, wire)
		}
		switch fieldNum {
		case 1:
			if wireType != 0 {
				return fmt.Errorf("proto: wrong wireType = %d for field EnableRecovery", wireType)
			}
			var v int
			for shift := uint(0); ; shift += 7 {
				if shift >= 64 {
					return ErrIntOverflowGenesis
				}
				if iNdEx >= l {
					return io.ErrUnexpectedEOF
				}
				b := dAtA[iNdEx]
				iNdEx++
				v |= int(b&0x7F) << shift
				if b < 0x80 {
					break
				}
			}
			m.EnableRecovery = bool(v != 0)
		case 2:
			if wireType != 2 {
				return fmt.Errorf("proto: wrong wireType = %d for field PacketTimeoutDuration", wireType)
			}
			var msglen int
			for shift := uint(0); ; shift += 7 {
				if shift >= 64 {
					return ErrIntOverflowGenesis
				}
				if iNdEx >= l {
					return io.ErrUnexpectedEOF
				}
				b := dAtA[iNdEx]
				iNdEx++
				msglen |= int(b&0x7F) << shift
				if b < 0x80 {
					break
				}
			}
			if msglen < 0 {
				return ErrInvalidLengthGenesis
			}
			postIndex := iNdEx + msglen
			if postIndex < 0 {
				return ErrInvalidLengthGenesis
			}
			if postIndex > l {
				return io.ErrUnexpectedEOF
			}
			if err := github_com_gogo_protobuf_types.StdDurationUnmarshal(&m.PacketTimeoutDuration, dAtA[iNdEx:postIndex]); err != nil {
				return err
			}
			iNdEx = postIndex
		default:
			iNdEx = preIndex
			skippy, err := skipGenesis(dAtA[iNdEx:])
			if err != nil {
				return err
			}
			if (skippy < 0) || (iNdEx+skippy) < 0 {
				return ErrInvalidLengthGenesis
			}
			if (iNdEx + skippy) > l {
				return io.ErrUnexpectedEOF
			}
			iNdEx += skippy
		}
	}

	if iNdEx > l {
		return io.ErrUnexpectedEOF
	}
	return nil
}

func skipGenesis(dAtA []byte) (n int, err error) {
	l := len(dAtA)
	iNdEx := 0
	depth := 0
	for iNdEx < l {
		var wire uint64
		for shift := uint(0); ; shift += 7 {
			if shift >= 64 {
				return 0, ErrIntOverflowGenesis
			}
			if iNdEx >= l {
				return 0, io.ErrUnexpectedEOF
			}
			b := dAtA[iNdEx]
			iNdEx++
			wire |= (uint64(b) & 0x7F) << shift
			if b < 0x80 {
				break
			}
		}
		wireType := int(wire & 0x7)
		switch wireType {
		case 0:
			for shift := uint(0); ; shift += 7 {
				if shift >= 64 {
					return 0, ErrIntOverflowGenesis
				}
				if iNdEx >= l {
					return 0, io.ErrUnexpectedEOF
				}
				iNdEx++
				if dAtA[iNdEx-1] < 0x80 {
					break
				}
			}
		case 1:
			iNdEx += 8
		case 2:
			var length int
			for shift := uint(0); ; shift += 7 {
				if shift >= 64 {
					return 0, ErrIntOverflowGenesis
				}
				if iNdEx >= l {
					return 0, io.ErrUnexpectedEOF
				}
				b := dAtA[iNdEx]
				iNdEx++
				length |= (int(b) & 0x7F) << shift
				if b < 0x80 {
					break
				}
			}
			if length < 0 {
				return 0, ErrInvalidLengthGenesis
			}
			iNdEx += length
		case 3:
			depth++
		case 4:
			if depth == 0 {
				return 0, ErrUnexpectedEndOfGroupGenesis
			}
			depth--
		case 5:
			iNdEx += 4
		default:
			return 0, fmt.Errorf("proto: illegal wireType %d", wireType)
		}
		if iNdEx < 0 {
			return 0, ErrInvalidLengthGenesis
		}
		if depth == 0 {
			return iNdEx, nil
		}
	}
	return 0, io.ErrUnexpectedEOF
}

var (
	ErrInvalidLengthGenesis        = fmt.Errorf("proto: negative length found during unmarshaling")
	ErrIntOverflowGenesis          = fmt.Errorf("proto: integer overflow")
	ErrUnexpectedEndOfGroupGenesis = fmt.Errorf("proto: unexpected end of group")
)
