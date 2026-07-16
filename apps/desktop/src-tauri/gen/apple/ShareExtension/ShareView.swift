import SwiftUI

/// The share sheet's content: saving spinner → "Saved to Reflect" (then the
/// sheet dismisses itself) or a failure with a Dismiss button. Copy stays
/// short and action-free — the save starts on appear, no confirm step.
struct ShareView: View {
    @EnvironmentObject var state: ShareState

    var body: some View {
        VStack(spacing: 16) {
            Spacer()
            switch state.status {
            case .saving:
                ProgressView()
                Text("share.saving")
                    .font(.body.weight(.medium))
                    .foregroundColor(.secondary)
            case .saved:
                Image(systemName: "checkmark.circle.fill")
                    .font(.system(size: 44))
                    .foregroundColor(.green)
                Text("share.saved")
                    .font(.body.weight(.medium))
            case .failed:
                Image(systemName: "exclamationmark.circle.fill")
                    .font(.system(size: 44))
                    .foregroundColor(.secondary)
                Text("share.failed")
                    .font(.body.weight(.medium))
            }
            Spacer()
            if case .failed = state.status {
                Button(action: { state.dismiss() }) {
                    Text("share.dismiss")
                        .frame(maxWidth: .infinity)
                        .padding()
                        .overlay(
                            RoundedRectangle(cornerRadius: 10)
                                .stroke(Color.secondary.opacity(0.4), lineWidth: 1)
                        )
                }
                .foregroundColor(.primary)
            }
        }
        .padding(24)
        .onAppear {
            state.save()
        }
    }
}
