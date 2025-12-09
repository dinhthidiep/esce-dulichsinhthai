using System.Security.Cryptography;

namespace ESCE_SYSTEM.Helper;

public class OTPGenerator
{
    public static string GenerateOTP(int length = 6)
    {
        var otp = new char[length];
        using (var rng = RandomNumberGenerator.Create())
        {
            byte[] randomNumber = new byte[length];
            rng.GetBytes(randomNumber);

            for (int i = 0; i < length; i++)
            {
                otp[i] = (char)('0' + (randomNumber[i] % 10));
            }
        }
        return new string(otp);
    }
}

