package types_test

import (
	"testing"

	"github.com/ethereum/go-ethereum/common"
	utiltx "github.com/evmos/evmos/v12/testutil/tx"
	"github.com/evmos/evmos/v12/types"
	"github.com/stretchr/testify/require"
)

func TestIsEmptyHash(t *testing.T) {
	testCases := []struct {
		name     string
		hash     string
		expEmpty bool
	}{
		{
			"empty string", "", true,
		},
		{
			"zero hash", common.Hash{}.String(), true,
		},

		{
			"non-empty hash", common.BytesToHash([]byte{1, 2, 3, 4}).String(), false,
		},
	}

	for _, tc := range testCases {
		require.Equal(t, tc.expEmpty, types.IsEmptyHash(tc.hash), tc.name)
	}
}

func TestIsZeroAddress(t *testing.T) {
	testCases := []struct {
		name     string
		address  string
		expEmpty bool
	}{
		{
			"empty string", "", true,
		},
		{
			"zero address", common.Address{}.String(), true,
		},

		{
			"non-empty address", common.BytesToAddress([]byte{1, 2, 3, 4}).String(), false,
		},
	}

	for _, tc := range testCases {
		require.Equal(t, tc.expEmpty, types.IsZeroAddress(tc.address), tc.name)
	}
}

func TestValidateAddress(t *testing.T) {
	testCases := []struct {
		name     string
		address  string
		expError bool
	}{
		{
			"empty string", "", true,
		},
		{
			"invalid address", "0x", true,
		},
		{
			"zero address", common.Address{}.String(), false,
		},
		{
			"valid address", utiltx.GenerateAddress().Hex(), false,
		},
	}

	for _, tc := range testCases {
		err := types.ValidateAddress(tc.address)

		if tc.expError {
			require.Error(t, err, tc.name)
		} else {
			require.NoError(t, err, tc.name)
		}
	}
}

func TestValidateNonZeroAddress(t *testing.T) {
	testCases := []struct {
		name     string
		address  string
		expError bool
	}{
		{
			"empty string", "", true,
		},
		{
			"invalid address", "0x", true,
		},
		{
			"zero address", common.Address{}.String(), true,
		},
		{
			"valid address", utiltx.GenerateAddress().Hex(), false,
		},
	}

	for _, tc := range testCases {
		err := types.ValidateNonZeroAddress(tc.address)

		if tc.expError {
			require.Error(t, err, tc.name)
		} else {
			require.NoError(t, err, tc.name)
		}
	}
}

func TestSafeInt64(t *testing.T) {
	testCases := []struct {
		name     string
		value    uint64
		expError bool
	}{
		{
			"no overflow", 10, false,
		},
		{
			"overflow", 18446744073709551615, true,
		},
	}

	for _, tc := range testCases {
		value, err := types.SafeInt64(tc.value)
		if tc.expError {
			require.Error(t, err, tc.name)
			continue
		}

		require.NoError(t, err, tc.name)
		require.Equal(t, int64(tc.value), value, tc.name)
	}
}
