using FluentValidation;

namespace Accounting.Application.Users.Commands.ChangePassword;

public class ChangeUserPasswordCommandValidator : AbstractValidator<ChangeUserPasswordCommand>
{
    public ChangeUserPasswordCommandValidator()
    {
        RuleFor(x => x.UserId).GreaterThan(0);

        RuleFor(x => x.NewPassword)
            .NotEmpty().WithMessage("رمز عبور الزامی است.")
            .MinimumLength(8).WithMessage("رمز عبور باید حداقل ۸ نویسه داشته باشد.")
            .Matches(@"[A-Z]").WithMessage("رمز عبور باید حداقل یک حرف بزرگ انگلیسی داشته باشد.")
            .Matches(@"[a-z]").WithMessage("رمز عبور باید حداقل یک حرف کوچک انگلیسی داشته باشد.")
            .Matches(@"[0-9]").WithMessage("رمز عبور باید حداقل یک رقم داشته باشد.");
    }
}
